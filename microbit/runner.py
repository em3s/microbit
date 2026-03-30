from microbit import *

while True:
    if button_a.was_pressed():
        print("jump")

    if button_b.was_pressed():
        print("slide")

    if pin_logo.is_touched():
        print("double")

    sleep(30)

