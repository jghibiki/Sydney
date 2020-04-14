import motor.motor_asyncio
from aiohttp import web

from sydney import constants
from sydney.utils.singleton import Singleton
from sydney.server.routes import route_table


class SydneyServer(metaclass=Singleton):
    def __init__(self, mongo_details):
        self.aiohttp_app = None

        self.mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
            mongo_details.connection_string
        )

        self.sydney_db = self.mongo_client[constants.mongo_db_name]

    def load(self):

        self.aiohttp_app = web.Application()
        self.app.add_routes(route_table)

    def start(self):
        web.run_app(self.aiohttp_app)
