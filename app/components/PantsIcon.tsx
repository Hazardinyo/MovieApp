import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface PantsIconProps {
  size?: number;
  color?: string;
}

const PantsIcon = ({ size = 56, color = "gray" }: PantsIconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 3H20V7.5L19 21H14L12.5 10L11 21H6L5 7.5V3Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default PantsIcon; 