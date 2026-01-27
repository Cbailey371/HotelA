import React from "react";

const ProfileImage = ({
  name,
  size = 48,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) => {
  const getInitials = (name: string): string => {
    if (!name.trim()) return "?";

    const nameArray = name.split(" ");
    const initials = nameArray
      .map((word) => word[0]?.toUpperCase() || "")
      .join("");

    return initials.slice(0, 2);
  };

  const getRandomPastelColor = (name: string): string => {
    if (!name.trim()) return "#6C7A89";

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const pastelColors = [
      "#9EAF89",
      "#6C7A89",
      "#C57B57",
      "#86608E",
      "#C6A969",
      "#4E9E8E",
      "#B97A8C",
      "#5A7684",
      "#A67B5B",
      "#A38FA3",
    ];

    const color = pastelColors[Math.abs(hash) % pastelColors.length];
    return color || "#6C7A89";
  };

  const initials = getInitials(name);
  const backgroundColor = getRandomPastelColor(name);

  return (
    <div
      className={`flex items-center justify-center rounded-full text-white font-bold ${className} shrink-0`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor,
        fontSize: `${size * 0.4}px`,
      }}
    >
      {initials}
    </div>
  );
};

export default ProfileImage;
