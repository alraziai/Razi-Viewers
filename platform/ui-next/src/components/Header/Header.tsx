import React, { ReactNode } from 'react';
import classNames from 'classnames';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
  Button,
  ToolButton,
} from '../';
import { IconPresentationProvider } from '@ohif/ui-next';
import { useUserAuthentication } from '../../contextProviders';

import NavBar from '../NavBar';

// Todo: we should move this component to composition and remove props base

interface HeaderProps {
  children?: ReactNode;
  menuOptions: Array<{
    title: string;
    icon?: string;
    onClick: () => void;
  }>;
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  isSticky?: boolean;
  WhiteLabeling?: {
    createLogoComponentFn?: (React: any, props: any) => ReactNode;
  };
  PatientInfo?: ReactNode;
  Secondary?: ReactNode;
  UndoRedo?: ReactNode;
}

function Header({
  children,
  menuOptions,
  isReturnEnabled = false,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  PatientInfo,
  UndoRedo,
  Secondary,
  ...props
}: HeaderProps): ReactNode {
  const [authState] = useUserAuthentication();
  const user = authState?.user;

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'DR';

    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }

    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return 'DR';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Dr. Sarah Chen';
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Doctor';
  };

  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  const handleGenerateReport = () => {
    // TODO: generate reports in a modal
  }

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <NavBar
        isSticky={isSticky}
        {...props}
      >
        <div className="relative h-[100px] items-center">
          <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center px-4">
            <div
              className={classNames(
                'mr-3 inline-flex items-center',
                isReturnEnabled && 'cursor-pointer'
              )}
              onClick={onClickReturn}
              data-cy="return-to-work-list"
            >
              {isReturnEnabled && <Icons.ArrowLeft className="text-primary ml-1 h-7 w-7" />}
              <div className="ml-1">
                {WhiteLabeling?.createLogoComponentFn?.(React, props) || (
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex flex-row items-center gap-4">
                      <Icons.RAZILogo />
                      <Icons.RAZILogoText />
                    </div>
                    <Icons.RAZIRadiologyText />
                  </div>
                )}
                {/* {WhiteLabeling?.createLogoComponentFn?.(React, props) || <Icons.RAZILogoText />} */}
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-[250px] h-8 -translate-y-1/2">{Secondary}</div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
            <div className="flex items-center justify-center space-x-2">{children}</div>
          </div>
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 select-none items-center">
            {UndoRedo}
            <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>
            {PatientInfo}
            <div className="border-primary-dark mx-1.5 h-[25px] border-r hidden"></div>
            <div className="flex-shrink-0">
              <button
                className="text-[#0D0FAF] h-full w-full gap-4 rounded-3xl py-4 px-14 bg-linear-to-b from-[#2E86D5] to-[#48FFF6] text-[12px] font-medium"
                style={{
                  background: 'linear-gradient(180deg, #2E86D5, #48FFF6',
                }}
                onClick={handleGenerateReport}
              >
                Generate Report
              </button>
            </div>
            <div className="flex-shrink-0 hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    // size="icon"
                    className="text-primary mt-2 h-full w-full gap-4 rounded-2xl border-2 border-[#FFFFFF1A] bg-[#FFFFFF0D] p-4"
                  >
                    <div
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[12px] font-medium text-white"
                      style={{
                        background: 'linear-gradient(180deg, #2E86D5, #48FFF6',
                      }}
                    >
                      {getUserInitials()}
                    </div>
                    <div className="flex flex-col items-start gap-1 text-white">
                      <div className="text-[12px] font-medium">{getUserDisplayName()}</div>
                      <div className="text-[10px] font-regular text-[#FFFFFF80]">Radiolgist</div>
                    </div>
                    <div className="flex w-5 items-center justify-center">
                      <Icons.RaziArrowDown />
                    </div>
                    {/* <Icons.GearSettings /> */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuOptions.map((option, index) => {
                    const IconComponent = option.icon
                      ? Icons[option.icon as keyof typeof Icons]
                      : null;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onSelect={option.onClick}
                        className="flex items-center gap-2 py-2"
                      >
                        {IconComponent && (
                          <span className="flex h-4 w-4 items-center justify-center">
                            <Icons.ByName name={option.icon} />
                          </span>
                        )}
                        <span className="flex-1">{option.title}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </NavBar>
    </IconPresentationProvider>
  );
}

export default Header;
