from microbit import *

# ─── 선생님 제공 (건드리지 말 것) ───────────────────────────
# read() → (d, kind, pstate, now, is_new)
#   d, kind, pstate : 게임 상태
#   now             : 현재 시각 (ms)
#   is_new          : True면 방금 새 장애물이 나타남 → 관찰 초기화 필요
# act(cmd) → 현재 장애물에 아직 안 쐈으면 송신 ("jump"/"double"/"slide")

uart.init(baudrate=115200)
display.show(Image.HEART)

_ICONS = {"jump": Image.ARROW_N, "double": Image.ARROW_N, "slide": Image.ARROW_S}
_last_d = _last_kind = None
_fired = set()
_first = True

def read():
    global _last_d, _last_kind, _fired, _first
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
            display.show(Image.NO); continue

        now = running_time()
        if _first:
            display.show(Image.YES); _first = False

        is_new = kind != _last_kind or (_last_d is not None and d > _last_d + 80)
        if is_new:
            _fired = set()
        _last_kind, _last_d = kind, d
        return d, kind, pstate, now, is_new

def act(cmd):
    if cmd in _fired: return
    _fired.add(cmd)
    uart.write(cmd + "\n")
    display.show(_ICONS.get(cmd, Image.ARROW_N))


# ─── 학생이 고치는 부분 ─────────────────────────────────────
last_d = last_t = None

while True:
    d, kind, pstate, now, is_new = read()

    # 새 장애물이면 관찰 다시 시작
    if is_new:
        last_d, last_t = d, now
        continue

    # 두 번의 관찰로 속도 계산 (거리 단위: 픽셀, 시간 단위: ms)
    speed = (last_d - d) / (now - last_t)     # 픽셀/ms
    last_d, last_t = d, now
    if speed <= 0: continue

    eta = d / speed                           # 도달까지 남은 시간 (ms)

    if kind == "gate"  and eta < 200:                     act("slide")
    if kind == "tall"  and eta < 350:                     act("jump")
    if kind == "combo" and eta < 500:                     act("jump")
    if kind == "combo" and eta < 250 and pstate == "J":   act("double")
