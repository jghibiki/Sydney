import motor.motor_asyncio
from aiohttp import web

from sydney import constants
from sydney.utils.singleton import Singleton
from sydney.server.route_adapter import route_adapter
from sydney.server.routes import register_routes


class SydneyServer(metaclass=Singleton):
    def __init__(self, mongo_helper):
        self.aiohttp_app = None

        self.mongo_helper = mongo_helper

    def load(self):

        self.aiohttp_app = web.Application()
        self.aiohttp_app["mongo_helper"] = self.mongo_helper
        route_adapter.register_app(self.aiohttp_app)
        register_routes()
        self.aiohttp_app.add_routes(route_adapter.get_route_table())

    def start(self):
        web.run_app(self.aiohttp_app)
