from microbit import *

logo_was_touched = False

while True:
    if button_a.was_pressed():
        print("jump")

    if button_b.was_pressed():
        print("slide")

    # 로고 터치 (엣지 감지, 한번만)
    logo_touched = pin_logo.is_touched()
    if logo_touched and not logo_was_touched:
        print("double")
    logo_was_touched = logo_touched

    sleep(30)
