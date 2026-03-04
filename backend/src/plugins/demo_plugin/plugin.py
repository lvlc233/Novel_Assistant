from typing import List, Optional
from core.plugin.annotations import plugin_meta, operation
from core.ui.base import Page, Slot, Component
from common.enums import PluginFromTypeEnum

# Define UI Structure
class Home(Page):
    class Main(Slot):
        class WelcomeCard(Component):
            def __init__(self, message: str, user_name: str = "Guest"):
                self.message = message
                self.user_name = user_name

@plugin_meta(
    name="HelloWorld",
    space="demo",
    version="1.0.0",
    description="A demo plugin for SDUI verification",
    from_type=PluginFromTypeEnum.OFFICIAL,
    tags=["demo", "test"]
)
class HelloWorldPlugin:
    
    @operation(
        name="say_hello",
        # Bind this operation to the WelcomeCard component
        with_ui=[Home.Main.WelcomeCard.filter()], 
        ui_target=Home.Main.WelcomeCard
    )
    def say_hello(self, name: str = "User"):
        """
        Returns a greeting message.
        """
        return {
            "message": f"Hello, {name}!",
            "user_name": name
        }
