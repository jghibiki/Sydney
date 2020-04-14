import click
from sydney.schema import SydneySchemaHelper
from sydney.server import SydneyServer
from sydney.schema.config_loader import ConfigLoader
from sydney.schema.mongo_helper import MongoHelper


@click.group()
@click.pass_context
@click.option("--mongo_host", default="localhost", envvar="SYDNEY_MONGO_HOST")
@click.option("--mongo_port", default="27017", envvar="SYDNEY_MONGO_PORT")
@click.option("--mongo_user", default=None, envvar="SYDNEY_MONGO_USER")
@click.option("--mongo_password", default=None, envvar="SYDNEY_MONGO_PASSWORD")
@click.option("--mongo_auth_db", default="sydney", envvar="SYDNEY_MONGO_AUTH_DB")
def cli(ctx, mongo_host, mongo_port, mongo_user, mongo_password, mongo_auth_db):
    ctx.obj = {
        "mongo": MongoHelper(
            mongo_host, mongo_port, mongo_user, mongo_password, mongo_auth_db
        )
    }


@cli.group()
@click.option("--config")
@click.option("--pipelines")
@click.pass_context
def schema(ctx, config, pipelines):
    ctx.obj["schema"] = ConfigLoader(config, pipelines)


@schema.command()
@click.pass_context
def validate(ctx):
    schema_helper = SydneySchemaHelper(ctx.obj["mongo"], ctx.obj["schema"])
    schema_helper.validate()


@schema.command()
@click.pass_context
def init(ctx):
    schema_helper = SydneySchemaHelper(ctx.obj["mongo"], ctx.obj["schema"])
    schema_helper.init()


@schema.command()
@click.pass_context
def update(ctx):
    schema_helper = SydneySchemaHelper(ctx.obj["mongo"], ctx.obj["schema"])
    schema_helper.update()


@schema.command()
@click.pass_context
def uninit(ctx):
    """
    Removes all Sydney collections from the mongo instance and effectively un-initializes Sydney.

    Note: This is a destructive command and all data will be lost.
    """
    schema_helper = SydneySchemaHelper(ctx.obj["mongo"], ctx.obj["schema"])
    schema_helper.uninit()


@cli.command()
@click.pass_context
def server(ctx):

    app = SydneyServer(ctx.obj["mongo"])
    app.load()

    app.start()


cli()
