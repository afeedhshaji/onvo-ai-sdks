import React from "react";
import { Meta, StoryObj } from "@storybook/react";

import { Icon } from "./Icon";
import { UserIcon } from "@heroicons/react/24/solid";

const meta: Meta = {
  component: Icon,
  title: "Tremor/Icon",
  argTypes: {},
};
export default meta;

type Story = StoryObj<typeof Icon>;

export const Variants: Story = (args) => (
  <div className="flex flex-col gap-8 p-8 dark:bg-slate-800 items-start justify-start h-screen w-screen">
    <div className="onvo-flex onvo-w-full onvo-p-8 onvo-flex-row onvo-gap-2 onvo-justify-start onvo-items-start">
      <Icon icon={UserIcon} />
      <Icon variant="shadow" icon={UserIcon} />
      <Icon variant="outlined" icon={UserIcon} />
      <Icon variant="light" icon={UserIcon} />
      <Icon variant="solid" icon={UserIcon} />
    </div>
    <div className="onvo-flex onvo-w-full onvo-p-8 onvo-flex-row onvo-gap-2 onvo-justify-start onvo-items-start">
      <Icon variant="shadow" icon={UserIcon} size="xs" />
      <Icon variant="shadow" icon={UserIcon} size="sm" />
      <Icon variant="shadow" icon={UserIcon} size="md" />
      <Icon variant="shadow" icon={UserIcon} size="lg" />
      <Icon variant="shadow" icon={UserIcon} size="xl" />
    </div>
  </div>
);
Variants.args = {};
