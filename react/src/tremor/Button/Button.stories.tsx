import React from "react";
import { Meta, StoryObj } from "@storybook/react";

import { Button } from "./Button";

const meta: Meta = {
  component: Button,
  title: "Primitives/Button",
  argTypes: {},
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Variants: Story = (args) => (
  <div className="onvo-flex onvo-flex-row onvo-gap-2">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="light">Light</Button>
    <Button variant="destructive">Destructive</Button>
    <Button disabled>Disabled</Button>
    <Button isLoading>Loading</Button>
  </div>
);
Variants.args = {};
