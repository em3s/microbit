from microbit import *

# ===== 설정 =====
SENSITIVITY = 10  # 감도 (기본: 높음, 줄이면 정밀)

def move(x):
    print("x:{}".format(int(x)))

while True:
    x = accelerometer.get_x() * SENSITIVITY

    move(x)

    # ★☆☆ A버튼 → 왼쪽 순간이동
    if button_a.was_pressed():
        print("left")

    # ★☆☆ B버튼 → 오른쪽 순간이동
    if button_b.was_pressed():
        print("right")

    # ★★☆ 로고 터치 → boom (전체 클리어)
    if pin_logo.is_touched():
        print("boom")

    sleep(30)
