import requests
import time

def set_state(step, state):
    requests.get(f"http://localhost:5000/notify/{step}/{state}")


def reset():
    set_state("step_1", "pending")
    set_state("step_2", "pending")
    set_state("step_3a", "pending")
    set_state("step_3b", "pending")
    set_state("step_4", "pending")


reset()

time.sleep(5)
set_state("step_1", "ok")
time.sleep(1)
set_state("step_2", "ok")
time.sleep(2)
set_state("step_3a", "ok")
set_state("step_3b", "skipped")
time.sleep(4)
set_state("step_4", "failed")
