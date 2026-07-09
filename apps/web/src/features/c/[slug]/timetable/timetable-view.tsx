"use client";

import { api } from "@instello/convex/api";
import { Button } from "@instello/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@instello/ui/components/empty";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconCalendar, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import Container from "@/components/common/container";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderEnd,
  PageHeaderStart,
  PageHeaderTitle,
} from "@/components/common/page-header";
import { TimetableViewer } from "@/components/timetable/timetable";
import {
  dtoToHourSpans,
  dtoToPublishInfo,
  mapProgramSubjects,
} from "@/components/timetable/timetable-mappers";
import { TimetablePublishInfo } from "@/components/timetable/timetable-publish-info";
import { useInsQuery } from "@/hooks/convex-react";
import { useClassSlug } from "@/hooks/use-class-slug";
import { useProgramAlias } from "@/hooks/use-program-alias";

function TimetableViewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}

export function TimetableView({ basePath }: { basePath: string }) {
  const programAlias = useProgramAlias();
  const classSlug = useClassSlug();
  const searchParams = useSearchParams();
  const versionParam = searchParams.get("v");
  const requestedVersion = versionParam ? Number(versionParam) : null;
  const viewingHistoricalVersion =
    requestedVersion !== null &&
    !Number.isNaN(requestedVersion) &&
    requestedVersion > 0;

  const program = useInsQuery(api.programs.getByAlias, { alias: programAlias });
  const cls = useInsQuery(
    api.classes.getBySlug,
    program && classSlug ? { programId: program._id, classSlug } : "skip",
  );

  const latestTimetable = useInsQuery(
    api.timetables.getOrNull,
    program && classSlug
      ? { programId: program._id, classAlias: classSlug }
      : "skip",
  );

  const versionedTimetable = useInsQuery(
    api.timetables.getByVersion,
    program && classSlug && viewingHistoricalVersion
      ? {
        programId: program._id,
        classAlias: classSlug,
        version: requestedVersion,
      }
      : "skip",
  );

  const timetable = viewingHistoricalVersion
    ? versionedTimetable
    : latestTimetable;

  const programSubjects = useInsQuery(
    api.programSubjects.listByStage,
    program && cls
      ? {
        programId: program._id,
        academicStageId: cls.currentHeadStage._id,
      }
      : "skip",
  );

  const subjects = useMemo(
    () => (programSubjects ? mapProgramSubjects(programSubjects) : []),
    [programSubjects],
  );

  const hourSpans = useMemo(
    () => (timetable ? dtoToHourSpans(timetable, subjects) : []),
    [timetable, subjects],
  );

  const isLoading =
    program === undefined ||
    cls === undefined ||
    timetable === undefined ||
    (timetable !== null && programSubjects === undefined) ||
    (viewingHistoricalVersion && latestTimetable === undefined);

  const isLatest =
    !viewingHistoricalVersion ||
    (latestTimetable !== null &&
      latestTimetable !== undefined &&
      timetable !== null &&
      timetable !== undefined &&
      timetable.version === latestTimetable.version);

  const publishInfo =
    timetable && latestTimetable
      ? {
        ...dtoToPublishInfo(timetable),
        totalVersions: latestTimetable.version,
      }
      : null;

  return (
    <Container className="relative flex min-h-0 flex-1 flex-col">
      <PageHeader>
        <PageHeaderStart>
          <PageHeaderTitle>Timetable</PageHeaderTitle>
          <PageHeaderDescription>
            Manage the timetable for{" "}
            <i className="text-foreground">{cls?.name ?? "this class"}</i> in{" "}
            <i className="text-foreground">{program?.name}</i>
          </PageHeaderDescription>
        </PageHeaderStart>

        {timetable ? (
          <PageHeaderEnd>
            <Button
              nativeButton={false}
              render={<Link href={`${basePath}/edit`} />}
            >
              <IconPlus /> New version
            </Button>
          </PageHeaderEnd>
        ) : null}
      </PageHeader>

      {isLoading ? (
        <TimetableViewSkeleton />
      ) : timetable === null ? (
        <Empty className="min-h-72 border border-dashed border-border">
          <EmptyMedia variant="icon">
            <IconCalendar />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No timetable yet</EmptyTitle>
            <EmptyDescription>
              Create the first timetable for this class to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              nativeButton={false}
              render={<Link href={`${basePath}/edit`} />}
            >
              <IconPlus />
              Create timetable
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {publishInfo ? (
            <TimetablePublishInfo
              {...publishInfo}
              historyHref={`${basePath}/versions`}
              isLatest={isLatest}
              latestHref={basePath}
            />
          ) : null}
          <TimetableViewer
            spans={hourSpans}
            sessionConfig={timetable.sessionConfig}
          />
        </div>
      )}
    </Container>
  );
}
