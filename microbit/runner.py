from microbit import *

# 러너 컨트롤러
#   A 버튼        = jump   (점프)
#   B 버튼        = double (더블 점프, 공중에서)
#   A + B 동시    = slide  (슬라이드)

while True:
    a = button_a.was_pressed()
    b = button_b.was_pressed()

    if a and b:
        print("slide")
    elif a:
        print("jump")
    elif b:
        print("double")

    # 옵션: 로고 터치로 슬라이드
    # if pin_logo.is_touched():
    #     print("slide")

    sleep(30)
