import {
  IconBrandGithub,
  IconBrandInstagram,
  IconBrandLinktree,
  IconBrandX,
} from "@tabler/icons-react";
import Image from "next/image";

export const siteConfig = {
  name: "Aruneem Bhowmick",
  description: "Aruneem Bhowmick's links.",
};

const dockIconClassName = "h-full w-full text-neutral-400";

export const siteLinks = [
  {
    title: "GitHub",
    href: "https://github.com/aruneem-bhowmick",
    icon: <IconBrandGithub className={dockIconClassName} />,
  },
  {
    title: "Website",
    href: "https://aruneem-bhowmick.github.io/",
    icon: (
      <Image
        src="/favicon-portfolio.svg"
        alt=""
        width={24}
        height={24}
        className="h-full w-full"
      />
    ),
  },
  {
    title: "Instagram",
    href: "https://www.instagram.com/aruneem.bhowmick/",
    icon: <IconBrandInstagram className={dockIconClassName} />,
  },
  {
    title: "X",
    href: "https://x.com/aruneembhowmick",
    icon: <IconBrandX className={dockIconClassName} />,
  },
  {
    title: "Linktree",
    href: "https://linktr.ee/aruneem.bhowmick",
    icon: <IconBrandLinktree className={dockIconClassName} />,
  },
];
