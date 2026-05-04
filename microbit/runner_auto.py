from microbit import *

# ─── 선생님 제공 (건드리지 말 것) ───────────────────────────
# read() → (kind, d, pstate, now)
#   kind   : 장애물 종류 ("tall" / "gate" / "combo")
#   d      : 장애물까지 남은 거리 (작을수록 가까움)
#   pstate : 플레이어 상태 ("G"=달림 / "J"=점프중 / "D"=슬라이드중)
#   now    : 현재 시각 (ms)
# act(cmd) → 명령 송신 ("jump"/"double"/"slide")
#   같은 명령을 매 루프 보내도 게임이 알아서 무시함 (쿨다운 + 상태 가드)

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
        # 게임 재시작 신호 — 잔여 버퍼 비우고 새 데이터 기다림
        if kind == "reset":
            while uart.readline():
                pass
            continue
        return kind, d, pstate, running_time()

def act(cmd):
    uart.write(cmd + "\n")


# ─── 학생이 고치는 부분 ─────────────────────────────────────
# 규칙은 하나: "장애물이 가까워지면(=d가 작아지면) 행동한다"
# 같은 명령을 매 루프 보내도 게임이 알아서 한 번만 처리함
# 콤보는 거리 기준을 두 개 두면 자동으로 콤보가 됨 (멀 때 점프, 더 가까이서 이단)

while True:
    kind, d, pstate, now = read()

    if kind == "tall" and d < 100:
        act("jump")
    elif kind == "gate" and d < 60:
        act("slide")
    elif kind == "combo":
        if d < 200 and pstate == "G": act("jump")    # 땅에서만 점프
        if d < 100 and pstate == "J": act("double")  # 공중에서만 더블 (vy 덮어쓰기 방지)
