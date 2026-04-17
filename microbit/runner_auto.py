from microbit import *

# 러너 자동 플레이
# 게임이 50ms마다 보냄: "d,kind,pstate,sc,go\n"  (예: "350,tall,G,120,0")
#   d      = 다음 장애물까지 거리 (픽셀)
#   kind   = "tall" / "combo" / "gate" / "none"
#   pstate = "G"(땅) / "J"(공중) / "D"(슬라이드중)
#
# LED: HEART(시작) → YES(수신) / ARROW_N(jump,double) / ARROW_S(slide) / NO(에러)

uart.init(baudrate=115200)
display.show(Image.HEART)

_buf = b""

def wait_state():
    global _buf
    while True:
        chunk = uart.read()
        if chunk:
            _buf += chunk
        if b"\n" in _buf:
            lines = _buf.split(b"\n")
            _buf = lines[-1]
            if len(lines) >= 2:
                try:
                    p = str(lines[-2], "utf-8").split(",")
                    return int(p[0]), p[1], p[2], running_time()
                except:
                    display.show(Image.NO)
        else:
            sleep(5)

def send(cmd):
    uart.write(cmd + "\n")

# 튜닝
JUMP_ETA, COMBO_ETA, SLIDE_ETA, DOUBLE_ETA = 350, 500, 200, 250

last_d = last_t = last_kind = None
acted = doubled = False
first = True

while True:
    d, kind, p, now = wait_state()
    if first:
        display.show(Image.YES)
        first = False

    # 새 장애물: 상태 리셋
    if kind != last_kind or (last_d is not None and d > last_d + 80):
        last_d, last_t, last_kind = d, now, kind
        acted = doubled = False
        continue

    if last_d is None or now == last_t:
        last_d, last_t = d, now
        continue

    speed = (last_d - d) / (now - last_t)
    last_d, last_t = d, now
    if not (0 < speed < 2.0):
        continue
    eta = d / speed

    if not acted:
        if kind == "gate" and eta < SLIDE_ETA:
            send("slide"); display.show(Image.ARROW_S); acted = True
        elif kind == "tall" and eta < JUMP_ETA:
            send("jump"); display.show(Image.ARROW_N); acted = True
        elif kind == "combo" and eta < COMBO_ETA:
            send("jump"); display.show(Image.ARROW_N); acted = True

    if kind == "combo" and p == "J" and not doubled and eta < DOUBLE_ETA:
        send("double"); display.show(Image.ARROW_N); doubled = True
