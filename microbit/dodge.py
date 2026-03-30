from microbit import *

# ===== 설정 =====
SENSITIVITY = 10  # 감도 (기본: 높음, 줄이면 정밀)

def move(x):
    print("x:{}".format(int(x)))

logo_was_touched = False

while True:
    x = accelerometer.get_x() * SENSITIVITY
    move(x)

    # ★☆☆ A버튼 → 왼쪽 순간이동
    if button_a.was_pressed():
        print("left")

    # ★☆☆ B버튼 → 오른쪽 순간이동
    if button_b.was_pressed():
        print("right")

    # ★★☆ 로고 터치 → boom (엣지 감지, 한번만)
    logo_touched = pin_logo.is_touched()
    if logo_touched and not logo_was_touched:
        print("boom")
    logo_was_touched = logo_touched

    sleep(30)
