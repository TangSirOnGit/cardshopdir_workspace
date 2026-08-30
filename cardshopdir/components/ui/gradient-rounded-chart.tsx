"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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

const defaultChartData = [
  { month: "January", desktop: 342, mobile: 245 },
  { month: "February", desktop: 876, mobile: 654 },
  { month: "March", desktop: 512, mobile: 387 },
  { month: "April", desktop: 629, mobile: 521 },
  { month: "May", desktop: 458, mobile: 412 },
  { month: "June", desktop: 781, mobile: 598 },
  { month: "July", desktop: 394, mobile: 312 },
  { month: "August", desktop: 925, mobile: 743 },
  { month: "September", desktop: 647, mobile: 489 },
  { month: "October", desktop: 532, mobile: 476 },
  { month: "November", desktop: 803, mobile: 687 },
  { month: "December", desktop: 271, mobile: 198 },
];

export function GradientRoundedAreaChart({
  data = defaultChartData,
  title,
  description,
  seriesALabel = "Series A",
  seriesBLabel = "Series B",
}: {
  data?: { month: string; desktop: number; mobile: number }[];
  title?: string;
  description?: string;
  seriesALabel?: string;
  seriesBLabel?: string;
} = {}) {
  const chartData = data;
  const chartConfig = {
    desktop: {
      label: seriesALabel,
      color: "var(--chart-1)",
    },
    mobile: {
      label: seriesBLabel,
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="ring-0 shadow-none" size="sm">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient
                id="gradient-rounded-chart-desktop"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="gradient-rounded-chart-mobile"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="mobile"
              type="monotone"
              fill="url(#gradient-rounded-chart-mobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              strokeWidth={0.8}
              strokeDasharray={"3 3"}
            />
            <Area
              dataKey="desktop"
              type="monotone"
              fill="url(#gradient-rounded-chart-desktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              strokeWidth={0.8}
              strokeDasharray={"3 3"}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
