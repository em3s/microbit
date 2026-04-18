from microbit import *

# ─── 선생님 제공 (건드리지 말 것) ───────────────────────────
# read() → (d, kind, pstate, now, is_new)
# act(cmd) → 현재 장애물에 아직 안 쐈으면 송신

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
# 거리만 보고 점프 — 금방 죽어요.
# 힌트: 두 번 관찰해서 속도를 구하면 eta(도달시간)를 계산할 수 있어요.

while True:
    d, kind, pstate, now, is_new = read()
    if d < 150:
        act("jump")
