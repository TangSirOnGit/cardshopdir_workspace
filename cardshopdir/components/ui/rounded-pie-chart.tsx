"use client";

import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
export const description = "A pie chart with a label list";

const defaultChartData = [
  { browser: "chrome", visitors: 275, fill: "var(--chart-1)" },
  { browser: "safari", visitors: 200, fill: "var(--chart-2)" },
  { browser: "firefox", visitors: 187, fill: "var(--chart-3)" },
  { browser: "edge", visitors: 173, fill: "var(--chart-4)" },
  { browser: "other", visitors: 90, fill: "var(--chart-5)" },
];

export function RoundedPieChart({
  data = defaultChartData,
  title,
  description,
  valueLabel = "Visitors",
}: {
  data?: { browser: string; visitors: number; fill: string; label?: string }[];
  title?: string;
  description?: string;
  valueLabel?: string;
} = {}) {
  const chartConfig = {
    visitors: {
      label: valueLabel,
    },
    ...Object.fromEntries(
      data.map((d) => [
        d.browser,
        { label: d.label ?? d.browser, color: d.fill },
      ]),
    ),
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col ring-0 shadow-none" size="sm">
      {(title || description) && (
        <CardHeader className="items-center pb-0">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square h-[140px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="browser" hideLabel />}
            />
            <Pie
              data={data}
              innerRadius={20}
              dataKey="visitors"
              nameKey="browser"
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
