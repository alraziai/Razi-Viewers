import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../DropdownMenu/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

export function StudyBrowserViewOptions({ tabs, onSelectTab, activeTabName }: withAppTypes) {
  const handleTabChange = (tabName: string) => {
    onSelectTab(tabName);
  };

  const activeTab = tabs.find(tab => tab.name === activeTabName);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger className="w-full w-[50%] overflow-hidden">
          <DropdownMenuTrigger className="border-[#FFFFFF1A] focus:border-[#48FFF6] flex h-[26px] w-full items-center justify-start rounded border bg-[#0A1628] p-2 text-base text-white hover:bg-[#083A4A] transition-colors">
            {activeTab?.label}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{activeTab?.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="bg-[#0A1628] border border-[#FFFFFF1A]">
        {tabs.map(tab => {
          const { name, label, studies } = tab;
          const isActive = activeTabName === name;
          const isDisabled = !studies.length;

          if (isDisabled) {
            return null;
          }

          return (
            <DropdownMenuItem
              key={name}
              className={`text-white ${isActive ? 'font-bold' : ''}`}
              onClick={() => handleTabChange(name)}
            >
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
