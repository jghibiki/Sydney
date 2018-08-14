import requests
import time

def set_state(step, state, exit_state=None):
    if exit_state:
        requests.get(f"http://localhost:5000/notify/{step}/{state}?exit_state={exit_state}")
    else:
        requests.get(f"http://localhost:5000/notify/{step}/{state}")


def reset():
    set_state("step_1", "pending")
    set_state("step_2", "pending")
    set_state("step_3a", "pending")
    set_state("step_3b", "pending")
    set_state("step_4", "pending")

    set_state("likes hamburgers", "pending")
    set_state("likes hotdogs", "pending")
    set_state("likes chicken patties", "pending")
    set_state("likes condiments", "pending")
    set_state("likes ketchup", "pending")
    set_state("likes mustard", "pending")
    set_state("likes mayo", "pending")
    set_state("eating", "pending")

reset()

time.sleep(5)
set_state("step_1", "ok")

time.sleep(0.5)
set_state("likes hamburgers", "running")
set_state("likes hotdogs", "running")
set_state("likes chicken patties", "running")

time.sleep(1.5)
set_state("likes hamburgers", "yes")
set_state("likes hotdogs", "no")
set_state("likes chicken patties", "no")

time.sleep(0.5)
set_state("step_2", "ok")


set_state("likes condiments", "running")
time.sleep(0.5)
set_state("likes condiments", "yes")

time.sleep(1)
set_state("likes ketchup", "running")
time.sleep(0.5)
set_state("likes mayo", "running")
time.sleep(0.25)
set_state("likes mustard", "running")

time.sleep(2)
set_state("likes ketchup", "skipped")
set_state("likes mustard", "yes")
set_state("likes mayo", "yes")

time.sleep(1)
set_state("step_3a", "ok")
set_state("step_3b", "skipped")

time.sleep(1)
set_state("eating", "running")
time.sleep(3)
set_state("eating", "yes", "__FINISHED__")

time.sleep(2)
set_state("step_4", "failed", "__QUIT__")
