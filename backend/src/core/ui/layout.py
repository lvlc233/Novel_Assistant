from core.ui.base import Page, Slot, Component

class AppLayout(Page):
    class Header(Slot):
        class Actions(Slot):
            pass

class Editor(Page):
    class Sidebar(Slot):
        pass

class WorkDetail(Page):
    class Bottom(Slot):
        pass

class Home(Page):
    class Main(Slot):
        pass

class Mailbox(Page):
    class Sidebar(Slot):
        pass
