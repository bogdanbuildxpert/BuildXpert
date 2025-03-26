import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "./components/filter-select";
import { ResetButton } from "./components/reset-button";
import { Pagination } from "./components/pagination";
import { UserActions } from "./components/user-actions";
import { CreateUserDialog } from "./components/create-user-dialog";

// Set dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Extract search parameters
  const search =
    typeof searchParams.search === "string" ? searchParams.search : "";
  const role =
    typeof searchParams.role === "string" ? searchParams.role : undefined;
  const verified =
    typeof searchParams.verified === "string"
      ? searchParams.verified
      : undefined;
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;

  // Calculate pagination offsets
  const skip = (page - 1) * perPage;

  // Build filter conditions
  const whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    whereClause.role = role;
  }

  if (verified === "verified") {
    whereClause.emailVerified = { not: null };
  } else if (verified === "unverified") {
    whereClause.emailVerified = null;
  }

  // Fetch users with pagination
  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: perPage,
  });

  // Get total count for pagination
  const totalUsers = await prisma.user.count({
    where: whereClause,
  });

  // Fetch totals for statistics
  const totalUsersCount = await prisma.user.count();
  const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
  const totalClients = await prisma.user.count({ where: { role: "CLIENT" } });

  // Define verification filter options
  const verificationOptions = [
    { value: "all", label: "All Users" },
    { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <CreateUserDialog />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>User Statistics</CardTitle>
          <CardDescription>
            Overview of registered users on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{totalUsersCount}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Admin Users</p>
              <p className="text-2xl font-bold">{totalAdmins}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Client Users</p>
              <p className="text-2xl font-bold">{totalClients}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            Manage user accounts and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <Tabs defaultValue={role || "all"} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" asChild>
                  <a href="/admin/users">All Users</a>
                </TabsTrigger>
                <TabsTrigger value="ADMIN" asChild>
                  <a href="/admin/users?role=ADMIN">Admins</a>
                </TabsTrigger>
                <TabsTrigger value="CLIENT" asChild>
                  <a href="/admin/users?role=CLIENT">Clients</a>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <form action="/admin/users" method="get">
                  {/* Preserve existing query parameters */}
                  {role && <input type="hidden" name="role" value={role} />}
                  {verified && (
                    <input type="hidden" name="verified" value={verified} />
                  )}
                  {perPage !== 10 && (
                    <input
                      type="hidden"
                      name="perPage"
                      value={perPage.toString()}
                    />
                  )}
                  <input type="hidden" name="page" value="1" />

                  <Input
                    placeholder="Search by name or email..."
                    name="search"
                    defaultValue={search}
                    className="w-full"
                  />
                </form>
              </div>
              <div className="w-full sm:w-1/2 flex gap-2">
                <div className="flex-1">
                  <FilterSelect
                    options={verificationOptions}
                    defaultValue={verified || "all"}
                    placeholder="Filter by verification"
                    paramName="verified"
                  />
                </div>
                <ResetButton href="/admin/users">Reset</ResetButton>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || "No name set"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "default" : "secondary"
                          }
                          className={
                            user.role === "ADMIN"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 hover:bg-green-100"
                          >
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          >
                            Not Verified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <UserActions user={user} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            totalItems={totalUsers}
            itemsPerPage={perPage}
            currentPage={page}
          />
        </CardContent>
      </Card>
    </div>
  );
}
