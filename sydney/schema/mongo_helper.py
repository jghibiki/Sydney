import asyncio
import motor.motor_asyncio

from sydney import constants


class MongoHelper:
    def __init__(
        self, mongo_host, mongo_port, mongo_user, mongo_password, mongo_auth_db
    ):
        self.host = mongo_host
        self.port = mongo_port
        self.user = mongo_user
        self.password = mongo_password
        self.auth_db = mongo_auth_db

        self._connection_string = None
        self.client = None
        self.db = None

    @property
    def connection_string(self):
        if self._connection_string is None:
            if self.user is None or self.password is None:
                self._connection_string = (
                    f"mongodb://{self.host}:{self.port}/{self.auth_db}"
                )
            else:
                self._connection_string = f"mongodb://{self.user}:{self.password}@{self.host}:{self.port}/{self.auth_db}?authMechanism=SCRAM-SHA-1"
        return self._connection_string

    def connect(self):

        if self.client is None:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(self.connection_string)

        self.db = self.client[constants.mongo_db_name]

    def get_collection(self, collection_name):
        if self.client is None:
            self.connect()
        return self.db[collection_name]

    def run_query(self, coro):
        return asyncio.get_event_loop().run_until_complete(coro)
