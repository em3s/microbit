from microbit import *

# 러너 자동 플레이 — 기본 샘플
# 게임이 50ms마다 보냄: "d,kind,pstate,sc,go\n"  (예: "350,tall,G,120,0")
#
# 거리가 150보다 가까워지면 무조건 점프 — 금방 죽어요!
# 왜 그런지 관찰하고 직접 고쳐보세요.

uart.init(baudrate=115200)
display.show(Image.HEART)

_buf = b""

def wait_d():
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
                    return int(str(lines[-2], "utf-8").split(",")[0])
                except:
                    display.show(Image.NO)
        else:
            sleep(5)

def send(cmd):
    uart.write(cmd + "\n")

display.show(Image.YES)

# ─── 학생이 고치는 부분 ───
while True:
    d = wait_d()
    if d < 150:
        send("jump")
        display.show(Image.ARROW_N)
