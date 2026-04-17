# 러너 자동 플레이 — 목표 코드 (속도 계산으로 오래 살아남기)
#
# 핵심 아이디어:
#   - 속도는 게임 중에 점점 빨라짐 → 거리만 보면 안 됨
#   - 두 번 관찰하면 속도를 계산할 수 있음:  속도 = (줄어든 거리) / (지난 시간)
#   - 도달 예상 시간(eta) = 거리 / 속도
#   - 부딪히기 400ms 전쯤 점프하면 넉넉히 넘어감
#
# 주의:
#   - 장애물이 지나가면 d가 다음 장애물 거리로 "점프"해서 늘어남
#     → 이때 속도가 음수가 됨 → 무시해야 함 (speed > 0 체크)
#   - combo(더 높은 장애물)는 공중 상태(p == "J")에서 double을 추가로 쳐야 완전히 넘어감

from microbit import uart, running_time
import ujson

uart.init(baudrate=115200)

def wait_state():
    while True:
        line = uart.readline()
        if line:
            try:
                s = ujson.loads(line)
                return s["d"], s["o"], s["p"], running_time()
            except:
                pass

def send(cmd):
    uart.write(cmd + "\n")

last_d = None
last_t = None

while True:
    d, kind, pstate, now = wait_state()

    if last_d is not None and now != last_t:
        speed = (last_d - d) / (now - last_t)   # 픽셀/ms
        if speed > 0:
            eta = d / speed                       # 앞으로 부딪히기까지 ms

            if eta < 400:
                if kind == "gate":
                    send("slide")
                else:
                    send("jump")

            # 공중에 있고 combo면 바로 한 번 더 점프
            if kind == "combo" and pstate == "J" and eta < 250:
                send("double")

    last_d = d
    last_t = now
