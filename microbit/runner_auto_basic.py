# 러너 자동 플레이 — 기본 샘플 (중1 수준)
#
# 게임이 50ms마다 이런 줄을 보내요:
#   {"d":380,"o":"tall","p":"G","sc":120,"go":0}
#
#   d  = 다음 장애물까지 거리 (픽셀)
#   o  = 장애물 종류 ("tall" 높음 / "combo" 더 높음 / "gate" 낮음)
#   p  = 내 캐릭터 상태 ("G" 땅 / "J" 점프중 / "D" 슬라이드중)
#   sc = 점수
#   go = 게임오버(1이면 끝)
#
# 이 코드는 거리가 150보다 가까워지면 무조건 점프합니다.
# 실행하면 금방 죽어요. 왜 그런지 관찰하고 고쳐보세요!

from microbit import uart
import ujson

uart.init(baudrate=115200)

def wait_state():
    while True:
        line = uart.readline()
        if line:
            try:
                s = ujson.loads(line)
                return s["d"], s["o"]
            except:
                pass

def send(cmd):
    uart.write(cmd + "\n")

# ─── 학생이 고치는 부분 ───
while True:
    d, kind = wait_state()
    if d < 150:
        send("jump")
