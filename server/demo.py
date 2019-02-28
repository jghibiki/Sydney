import requests
import time

def set_state(environment, pipeline, step, state, exit_state=None):
    if exit_state:
        requests.get(f"http://localhost:5000/notify/{environment}/{pipeline}/{step}/{state}?exit_state={exit_state}")
    else:
        requests.get(f"http://localhost:5000/notify/{environment}/{pipeline}/{step}/{state}")

def send_message(environment, pipeline, step, message, level=None):
    if level:
        requests.post(f"http://localhost:5000/message/{environment}/{pipeline}/{step}?log_level={level}", json={"message":message})
    else:
        requests.post(f"http://localhost:5000/message/{environment}/{pipeline}/{step}", json={"message":message})

def reset_pipeline(env, pipeline, state):
    url = f"http://localhost:5000/reset/{env}/{pipeline}/{state}"
    response = requests.post(url)


def reset():
    for env in ["dev", "prod"]:
        reset_pipeline(env, "pipeline_1", "pending")
        reset_pipeline(env, "pipeline_2", "pending")

reset()


time.sleep(10)


set_state("prod", "pipeline_1", "step_2", "running")
send_message("prod", "pipeline_1", "step_2", "Pulling latest data.", "debug")
set_state("prod", "pipeline_1", "step_3a", "running")
set_state("prod", "pipeline_1", "step_3b", "running")
set_state("prod", "pipeline_1", "step_4", "running")

time.sleep(0.5)
send_message("dev", "pipeline_2", "step_2", "I am now running!")
set_state("dev", "pipeline_2", "likes hamburgers", "running")
set_state("dev", "pipeline_2", "likes hotdogs", "running")
set_state("dev", "pipeline_2", "likes chicken patties", "running")

time.sleep(1.5)
set_state("dev", "pipeline_2", "likes hamburgers", "yes")
set_state("dev", "pipeline_2", "likes hotdogs", "no")
set_state("dev", "pipeline_2", "likes chicken patties", "no")

time.sleep(0.5)
send_message("dev", "pipeline_1", "step_2", "Pipeline 2 finished!")
set_state("dev", "pipeline_1", "step_2", "ok")


set_state("dev", "pipeline_2", "likes condiments", "running")
time.sleep(0.5)
set_state("dev", "pipeline_2", "likes condiments", "yes")

time.sleep(1)
set_state("dev", "pipeline_2", "likes ketchup", "running")
time.sleep(0.5)
set_state("dev", "pipeline_2", "likes mayo", "running")
time.sleep(0.25)
set_state("dev", "pipeline_2", "likes mustard", "running")

time.sleep(2)
set_state("dev", "pipeline_2", "likes ketchup", "skipped")
set_state("dev", "pipeline_2", "likes mustard", "yes")
set_state("dev", "pipeline_2", "likes mayo", "yes")

time.sleep(1)
send_message("dev", "pipeline_1", "step_3a", "A message to post #1")
time.sleep(0.25)
set_state("dev", "pipeline_1", "step_3a", "ok")
set_state("dev", "pipeline_1", "step_3b", "skipped")
time.sleep(0.25)
send_message("dev", "pipeline_1", "step_3a", "A message to post #2", "debug")
time.sleep(0.25)
send_message("dev", "pipeline_1", "step_3a", "A message to post #3", "warn")

time.sleep(1)
set_state("dev", "pipeline_2", "eating", "running")
time.sleep(3)
set_state("dev", "pipeline_2", "eating", "failed", "__QUIT__")

time.sleep(2)
send_message("dev", "pipeline_1", "step_4", "Critical error!", "error")
set_state("dev", "pipeline_1", "step_4", "failed", "__QUIT__")


set_state("prod", "pipeline_1", "step_1", "ok")
set_state("prod", "pipeline_1", "step_2", "ok")
set_state("prod", "pipeline_1", "step_3a", "ok")
set_state("prod", "pipeline_1", "step_3b", "ok")
set_state("prod", "pipeline_1", "step_4", "ok")

send_message("DeV", "pipeline_1", "step_4", "Test envirnonment capitalization invariance", "debug")
