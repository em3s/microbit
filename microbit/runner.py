from microbit import *

# 러너 컨트롤러
#   A 버튼        = jump   (점프)
#   B 버튼        = double (더블 점프, 공중에서)
#   A + B 동시    = slide  (슬라이드)
#
# 단일 버튼 누름은 GRACE(ms) 만큼 기다렸다가 반응해요.
# 그 안에 반대쪽 버튼도 눌리면 slide로 인식합니다.

GRACE = 50  # ms — 값을 줄이면 반응 빠름, 늘리면 동시 판정 여유

pending = None
t0 = 0

while True:
    a_now = button_a.is_pressed()
    b_now = button_b.is_pressed()

    # 대기중인 단독 명령이 있는데 반대쪽도 눌렸으면 → 슬라이드로 전환
    if a_now and b_now and pending is not None:
        print("slide")
        pending = None
    else:
        if button_a.was_pressed():
            pending = "jump"
            t0 = running_time()
        if button_b.was_pressed():
            pending = "double"
            t0 = running_time()

        # 유예 시간 지나도 반대쪽이 안 왔으면 단독 명령 발사
        if pending is not None and running_time() - t0 >= GRACE:
            print(pending)
            pending = None

    # 옵션: 로고 터치로 슬라이드
    # if pin_logo.is_touched():
    #     print("slide")

    sleep(10)
