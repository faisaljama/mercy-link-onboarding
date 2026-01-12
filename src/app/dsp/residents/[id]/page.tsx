import { prisma } from "@/lib/prisma";
import { getSession, getUserHouseIds } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Heart,
  AlertCircle,
  Sun,
  Frown,
  Smile,
  MessageCircle,
  Calendar,
  Users,
  Target,
  Lightbulb,
  Star,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

async function getResidentProfile(id: string, houseIds: string[]) {
  const client = await prisma.client.findFirst({
    where: {
      id,
      houseId: { in: houseIds },
    },
    include: {
      house: {
        select: { id: true, name: true },
      },
      onePageProfile: true,
    },
  });

  return client;
}

export default async function ResidentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const houseIds = await getUserHouseIds(session.id);

  const resident = await getResidentProfile(id, houseIds);

  if (!resident) {
    notFound();
  }

  const profile = resident.onePageProfile;
  const profilePhoto = profile?.photoUrl || resident.photoUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dsp/residents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Residents
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={`${resident.firstName} ${resident.lastName}`}
              className="h-32 w-32 rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="h-32 w-32 rounded-xl bg-purple-100 flex items-center justify-center shadow-lg">
              <span className="text-purple-600 font-bold text-4xl">
                {resident.firstName[0]}{resident.lastName[0]}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">
            {profile?.preferredName || resident.firstName} {resident.lastName}
          </h1>
          {profile?.pronouns && (
            <p className="text-slate-500 mt-1">{profile.pronouns}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{resident.house.name}</Badge>
            {profile?.medicalAlerts && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Medical Alerts
              </Badge>
            )}
          </div>
          {!profile && (
            <p className="text-sm text-slate-500 mt-4 p-4 bg-slate-50 rounded-lg">
              No one-page profile has been created yet. Contact a supervisor to set up this resident&apos;s profile.
            </p>
          )}
        </div>
      </div>

      {profile && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* About Me */}
          {profile.aboutMe && (
            <ProfileSection
              icon={User}
              title="About Me"
              content={profile.aboutMe}
              color="purple"
            />
          )}

          {/* Communication */}
          {profile.communication && (
            <ProfileSection
              icon={MessageCircle}
              title="How I Communicate"
              content={profile.communication}
              color="blue"
            />
          )}

          {/* Daily Routine */}
          {profile.dailyRoutine && (
            <ProfileSection
              icon={Calendar}
              title="My Daily Routine"
              content={profile.dailyRoutine}
              color="green"
            />
          )}

          {/* Likes & Interests */}
          {profile.likesInterests && (
            <ProfileSection
              icon={Heart}
              title="What I Like"
              content={profile.likesInterests}
              color="pink"
            />
          )}

          {/* Good Day */}
          {profile.goodDay && (
            <ProfileSection
              icon={Smile}
              title="What Makes a Good Day"
              content={profile.goodDay}
              color="yellow"
            />
          )}

          {/* Bad Day */}
          {profile.badDay && (
            <ProfileSection
              icon={Frown}
              title="What Makes a Bad Day"
              content={profile.badDay}
              color="orange"
            />
          )}

          {/* Support When Upset */}
          {profile.supportWhenUpset && (
            <ProfileSection
              icon={Lightbulb}
              title="How to Support Me When I'm Upset"
              content={profile.supportWhenUpset}
              color="teal"
            />
          )}

          {/* Important People */}
          {profile.importantPeople && (
            <ProfileSection
              icon={Users}
              title="Important People in My Life"
              content={profile.importantPeople}
              color="indigo"
            />
          )}

          {/* Medical Alerts */}
          {profile.medicalAlerts && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  Medical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800 whitespace-pre-wrap">{profile.medicalAlerts}</p>
              </CardContent>
            </Card>
          )}

          {/* Cultural Considerations */}
          {profile.culturalConsiderations && (
            <ProfileSection
              icon={Star}
              title="Cultural Considerations"
              content={profile.culturalConsiderations}
              color="amber"
            />
          )}

          {/* Current Goals */}
          {profile.currentGoals && (
            <ProfileSection
              icon={Target}
              title="My Current Goals"
              content={profile.currentGoals}
              color="emerald"
            />
          )}

          {/* Important TO Me */}
          {profile.importantToMe && (
            <ProfileSection
              icon={Heart}
              title="What's Important TO Me"
              content={profile.importantToMe}
              color="rose"
            />
          )}

          {/* Important FOR Me */}
          {profile.importantForMe && (
            <ProfileSection
              icon={Star}
              title="What's Important FOR Me"
              content={profile.importantForMe}
              color="violet"
            />
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={`/dsp/shift-notes?clientId=${resident.id}`}>
            <Button variant="outline">Write Progress Note</Button>
          </Link>
          <Link href={`/dsp/documents?clientId=${resident.id}`}>
            <Button variant="outline">View Documents</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSection({
  icon: Icon,
  title,
  content,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "text-purple-600 bg-purple-50",
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    pink: "text-pink-600 bg-pink-50",
    yellow: "text-yellow-600 bg-yellow-50",
    orange: "text-orange-600 bg-orange-50",
    teal: "text-teal-600 bg-teal-50",
    indigo: "text-indigo-600 bg-indigo-50",
    amber: "text-amber-600 bg-amber-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50",
    violet: "text-violet-600 bg-violet-50",
  };

  const iconColor = colorClasses[color]?.split(" ")[0] || "text-slate-600";
  const bgColor = colorClasses[color]?.split(" ")[1] || "bg-slate-50";

  return (
    <Card className={bgColor}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg flex items-center gap-2 ${iconColor}`}>
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}
