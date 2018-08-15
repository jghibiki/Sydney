import requests
import time

def set_state(pipeline, step, state, exit_state=None):
    if exit_state:
        requests.get(f"http://localhost:5000/notify/{pipeline}/{step}/{state}?exit_state={exit_state}")
    else:
        requests.get(f"http://localhost:5000/notify/{pipeline}/{step}/{state}")


def reset():
    set_state("pipeline_1", "step_1", "pending")
    set_state("pipeline_1", "step_2", "pending")
    set_state("pipeline_1", "step_3a", "pending")
    set_state("pipeline_1", "step_3b", "pending")
    set_state("pipeline_1", "step_4", "pending")

    set_state("pipeline_2", "likes hamburgers", "pending")
    set_state("pipeline_2", "likes hotdogs", "pending")
    set_state("pipeline_2", "likes chicken patties", "pending")
    set_state("pipeline_2", "likes condiments", "pending")
    set_state("pipeline_2", "likes ketchup", "pending")
    set_state("pipeline_2", "likes mustard", "pending")
    set_state("pipeline_2", "likes mayo", "pending")
    set_state("pipeline_2", "eating", "pending")

reset()

time.sleep(5)
set_state("pipeline_1", "step_1", "ok")

time.sleep(0.5)
set_state("pipeline_2", "likes hamburgers", "running")
set_state("pipeline_2", "likes hotdogs", "running")
set_state("pipeline_2", "likes chicken patties", "running")

time.sleep(1.5)
set_state("pipeline_2", "likes hamburgers", "yes")
set_state("pipeline_2", "likes hotdogs", "no")
set_state("pipeline_2", "likes chicken patties", "no")

time.sleep(0.5)
set_state("pipeline_1", "step_2", "ok")


set_state("pipeline_2", "likes condiments", "running")
time.sleep(0.5)
set_state("pipeline_2", "likes condiments", "yes")

time.sleep(1)
set_state("pipeline_2", "likes ketchup", "running")
time.sleep(0.5)
set_state("pipeline_2", "likes mayo", "running")
time.sleep(0.25)
set_state("pipeline_2", "likes mustard", "running")

time.sleep(2)
set_state("pipeline_2", "likes ketchup", "skipped")
set_state("pipeline_2", "likes mustard", "yes")
set_state("pipeline_2", "likes mayo", "yes")

time.sleep(1)
set_state("pipeline_1", "step_3a", "ok")
set_state("pipeline_1", "step_3b", "skipped")

time.sleep(1)
set_state("pipeline_2", "eating", "running")
time.sleep(3)
set_state("pipeline_2", "eating", "yes", "__FINISHED__")

time.sleep(2)
set_state("pipeline_1", "step_4", "failed", "__QUIT__")
