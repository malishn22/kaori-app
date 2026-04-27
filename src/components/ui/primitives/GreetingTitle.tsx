import React from 'react';
import { HeaderText } from './HeaderText';

type GreetingTitleProps = {
  timeOfDay: string;
  initial: string;
};

export function GreetingTitle({ timeOfDay, initial }: GreetingTitleProps) {
  return (
    <HeaderText>
      {timeOfDay}, <HeaderText color="amber">{initial}.</HeaderText>
    </HeaderText>
  );
}
