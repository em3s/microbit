from microbit import *

# ─── 선생님 제공 (건드리지 말 것) ───────────────────────────
# read() → (kind, d, pstate, now)
#   kind   : 장애물 종류 ("tall" / "gate" / "combo")
#   d      : 장애물까지 남은 거리 (작을수록 가까움)
#   pstate : 플레이어 상태 ("G"=달림 / "J"=점프중 / "D"=슬라이드중)
#   now    : 현재 시각 (ms)
# act(cmd) → 명령 송신 ("jump"/"double"/"slide")

uart.init(baudrate=115200)
display.show(Image.YES)

# 부팅 시 잔여 버퍼 비우기
while uart.readline():
    pass

def read():
    while True:
        line = uart.readline()
        if not line:
            sleep(5); continue
        while True:
            nxt = uart.readline()
            if not nxt: break
            line = nxt
        try:
            p = str(line, "utf-8").strip().split(",")
            d, kind, pstate = int(p[0]), p[1], p[2]
        except:
            continue
        if kind == "reset":
            while uart.readline():
                pass
            continue
        return kind, d, pstate, running_time()

def act(cmd):
    uart.write(cmd + "\n")


# ─── 학생이 고치는 부분 (advanced — 적응형 자율주행) ────────
# 거리(d)가 아니라 "도착까지 남은 시간(eta)"으로 결정한다.
# - 게임이 빨라져도 의미가 그대로 유지됨 ("정점에서 만나도록 늘 정확한 타이밍")
# - 단순 버전(d 기반)은 속도가 2배 변하면 첫 점프가 너무 일찍/늦게 되는 문제
#
# 1단계: 속도 추정 — 거리 변화 / 시간 변화. 노이즈는 평균(EMA)으로 부드럽게
# 2단계: eta = d / speed → 시간 단위로 결정

last_d = 0
last_t = 0
speed = 0.0   # 픽셀/ms 단위. 예: 300px/s = 0.3

while True:
    kind, d, pstate, now = read()

    # ── 1단계: 속도 추정 ──
    # 같은 장애물이고 d가 정상적으로 줄어들 때만 샘플로 사용
    # (새 장애물이 등장하면 d가 갑자기 커지는데, 그건 dd 음수로 자동 걸러짐)
    dt = now - last_t
    dd = last_d - d
    last_d = d
    last_t = now
    if dt > 0 and 0 < dd < 200:
        sample = dd / dt
        # 지수 이동 평균: 새 샘플 30% + 과거 추정 70%
        if speed == 0:
            speed = sample
        else:
            speed = 0.7 * speed + 0.3 * sample

    if speed <= 0:
        continue   # 아직 속도 모름

    # ── 2단계: eta 기반 결정 ──
    eta = d / speed   # 도착까지 ms

    if kind == "tall" and eta < 300 and pstate == "G":
        act("jump")          # 정점(330ms) 부근에서 obstacle 도달하도록
    elif kind == "gate" and eta < 250 and pstate == "G":
        act("slide")         # 슬라이드 0.5초 안에 통과하도록
    elif kind == "combo":
        if eta < 400 and pstate == "G": act("jump")     # 멀 때 1차 점프
        if eta < 200 and pstate == "J": act("double")   # 정점 부근에서 더블
