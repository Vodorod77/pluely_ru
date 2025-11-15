import {
  Settings,
  Code,
  MessagesSquare,
  WandSparkles,
  AudioLinesIcon,
  SquareSlashIcon,
  MonitorIcon,
  HomeIcon,
  PowerIcon,
  MailIcon,
  CoffeeIcon,
  GlobeIcon,
  BugIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useApp, useTranslation } from "@/contexts";
import { XIcon, GithubIcon } from "@/components";

export const useMenuItems = () => {
  const { hasActiveLicense } = useApp();
  const { t } = useTranslation();

  const menu: {
    icon: React.ElementType;
    label: string;
    href: string;
    count?: number;
  }[] = [
    {
      icon: HomeIcon,
      label: t("sidebar.dashboard"),
      href: "/dashboard",
    },
    {
      icon: MessagesSquare,
      label: t("sidebar.chats"),
      href: "/chats",
    },
    {
      icon: WandSparkles,
      label: t("sidebar.system_prompts"),
      href: "/system-prompts",
    },
    {
      icon: Settings,
      label: t("sidebar.app_settings"),
      href: "/settings",
    },
    {
      icon: MessageSquareTextIcon,
      label: t("sidebar.responses"),
      href: "/responses",
    },
    {
      icon: MonitorIcon,
      label: t("sidebar.screenshot"),
      href: "/screenshot",
    },
    {
      icon: AudioLinesIcon,
      label: t("sidebar.audio"),
      href: "/audio",
    },
    {
      icon: SquareSlashIcon,
      label: t("sidebar.cursor_shortcuts"),
      href: "/shortcuts",
    },

    {
      icon: Code,
      label: t("sidebar.dev_space"),
      href: "/dev-space",
    },
  ];

  const footerItems = [
    ...(hasActiveLicense
      ? [
          {
            icon: MailIcon,
            label: t("sidebar.contact_support"),
            href: "mailto:support@pluely.com",
          },
        ]
      : []),
    {
      icon: BugIcon,
      label: t("sidebar.report_bug"),
      href: "https://github.com/iamsrikanthnani/pluely/issues/new?template=bug-report.yml",
    },
    {
      icon: PowerIcon,
      label: t("sidebar.quit"),
      action: async () => {
        await invoke("exit_app");
      },
    },
  ];

  const footerLinks: {
    title: string;
    icon: React.ElementType;
    link: string;
  }[] = [
    {
      title: "Website",
      icon: GlobeIcon,
      link: "https://pluely.com",
    },
    {
      title: "Github",
      icon: GithubIcon,
      link: "https://github.com/iamsrikanthnani/pluely",
    },
    {
      title: "Buy Me a Coffee",
      icon: CoffeeIcon,
      link: "https://buymeacoffee.com/srikanthnani",
    },
    {
      title: "Follow on X",
      icon: XIcon,
      link: "https://x.com/truly_sn",
    },
  ];

  return {
    menu,
    footerItems,
    footerLinks,
  };
};
