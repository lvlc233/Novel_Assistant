import { Page, Slot, Component } from './base';

// 定义路径生成辅助函数
const p = (...parts: string[]) => '/' + parts.map(s => s.toLowerCase()).join('/');

export class AppLayout extends Page {
  static Header = class Header extends Slot {
    static id = p('AppLayout', 'Header');
    
    static Breadcrumb = class Breadcrumb extends Slot {
        static id = p('AppLayout', 'Header', 'Breadcrumb');
    }
    
    static Actions = class Actions extends Slot {
        static id = p('AppLayout', 'Header', 'Actions');
        
        static MailEntry = class MailEntry extends Component {
            static id = p('AppLayout', 'Header', 'Actions', 'MailEntry');
        }
    }
  }
}

export class Editor extends Page {
  static Sidebar = class Sidebar extends Slot {
    static id = p('Editor', 'Sidebar');
    
    static Assistant = class Assistant extends Component {
        static id = p('Editor', 'Sidebar', 'Assistant');
    }
  }
}

export class WorkDetail extends Page {
  static Bottom = class Bottom extends Slot {
    static id = p('WorkDetail', 'Bottom');
    
    static QuickInput = class QuickInput extends Component {
        static id = p('WorkDetail', 'Bottom', 'QuickInput');
    }
  }
}

export class Home extends Page {
  static Main = class Main extends Slot {
    static id = p('Home', 'Main');
    
    static ProjectChatInput = class ProjectChatInput extends Component {
        static id = p('Home', 'Main', 'ProjectChatInput');
    }
  }
}

export class Mailbox extends Page {
  static Sidebar = class Sidebar extends Slot {
    static id = p('Mailbox', 'Sidebar');
    
    static AgentItem = class AgentItem extends Component {
        static id = p('Mailbox', 'Sidebar', 'AgentItem');
    }
  }
}

// 导出扁平化的 Slot ID 供组件使用
export const SLOT_IDS = {
    HEADER_BREADCRUMB: AppLayout.Header.Breadcrumb.id,
    HEADER_ACTIONS: AppLayout.Header.Actions.id,
    EDITOR_SIDEBAR: Editor.Sidebar.id,
    WORK_DETAIL_BOTTOM: WorkDetail.Bottom.id,
    HOME_MAIN: Home.Main.id,
    MAILBOX_SIDEBAR: Mailbox.Sidebar.id
};
