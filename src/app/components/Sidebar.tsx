import { NavLink } from 'react-router';
import CoditiveIcon from '../assets/icons/coditive-icon.svg?react';
import S3BucketIcon from '../assets/icons/s3-bucket.svg?react';
import SettingsIcon from '../assets/icons/settings.svg?react';

export function Sidebar() {
  return (
    <div className="from-brand-gradient-start to-brand-gradient-end flex w-36 flex-col bg-linear-to-t">
      <div className="mt-12 mb-24 ml-12 flex items-center">
        <CoditiveIcon className="text-brand-light-blue size-14" />
      </div>

      <NavLink to="/" className="sidebar-link flex h-32 cursor-pointer flex-col items-center justify-center">
        <S3BucketIcon className="size-14 text-white" />
        <small className="mt-1 text-base">Bucket</small>
      </NavLink>

      <NavLink to="/settings" className="sidebar-link flex h-32 cursor-pointer flex-col items-center justify-center">
        <SettingsIcon className="size-14 text-white" />
        <small className="mt-1 text-base">Settings</small>
      </NavLink>
    </div>
  );
}
