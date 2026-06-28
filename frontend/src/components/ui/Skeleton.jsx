import React from 'react';

export const SidebarSkeleton = () => {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 bg-gray-800/80 rounded-xl w-full"></div>
      ))}
    </div>
  );
};

export const ChatHistorySkeleton = () => {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="flex space-x-3 items-start">
        <div className="w-8 h-8 rounded-full bg-gray-800"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-800 rounded w-1/4"></div>
          <div className="h-12 bg-gray-800 rounded w-3/4"></div>
        </div>
      </div>
      <div className="flex space-x-3 items-start justify-end">
        <div className="space-y-2 flex-1 flex flex-col items-end">
          <div className="h-4 bg-gray-800 rounded w-1/4"></div>
          <div className="h-10 bg-gray-800 rounded w-1/2"></div>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-950"></div>
      </div>
    </div>
  );
};

export const ResultPanelSkeleton = () => {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-800 rounded w-full"></div>
        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        <div className="h-4 bg-gray-800 rounded w-2/3"></div>
      </div>
      <div className="h-40 bg-gray-800/50 rounded-2xl w-full mt-6"></div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-4 p-6 animate-pulse">
      <div className="h-12 bg-gray-800 rounded-full w-12 mx-auto"></div>
      <div className="h-4 bg-gray-800 rounded w-1/3 mx-auto"></div>
      <div className="space-y-3 mt-6">
        <div className="h-10 bg-gray-800 rounded w-full"></div>
        <div className="h-10 bg-gray-800 rounded w-full"></div>
      </div>
    </div>
  );
};
