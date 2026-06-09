"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getKarigars,
  addKarigar,
  deleteKarigar,
  getJobWorks,
  addJobWork,
  updateJobStatus,
} from "@/actions/karigar.actions";
import type { JobStatus } from "@prisma/client";

const karigarSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  mobile: z.string().min(10, "Mobile must be at least 10 digits."),
  address: z.string().optional(),
});

const jobWorkSchema = z.object({
  karigarId: z.string().min(1, "Karigar is required."),
  description: z.string().min(3, "Description is required."),
  issueWeight: z.coerce.number().positive("Issue weight must be positive."),
});

type KarigarFormData = z.infer<typeof karigarSchema>;
type JobWorkFormData = z.infer<typeof jobWorkSchema>;

type KarigarRow = {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
  outstandingBalance: unknown;
  _count: { jobWorks: number };
};

type JobWorkRow = {
  id: string;
  jobNumber: string;
  description: string;
  status: JobStatus;
  issueWeight: unknown;
  receiveWeight: unknown;
  issueDate: string | Date;
  receiveDate: string | Date | null;
  karigar: { name: string; mobile: string };
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ASSIGNED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  DELIVERED: "outline",
};

const nextStatus: Record<string, JobStatus> = {
  ASSIGNED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "DELIVERED",
};

export default function KarigarClient() {
const [karigars, setKarigars] = useState<KarigarRow[]>([]);
  const [jobWorks, setJobWorks] = useState<JobWorkRow[]>([]);
  const [karigarOpen, setKarigarOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const karigarForm = useForm<KarigarFormData>({
    resolver: zodResolver(karigarSchema),
    defaultValues: { name: "", mobile: "", address: "" },
  });

  const jobForm = useForm<JobWorkFormData>({
    resolver: zodResolver(jobWorkSchema),
    defaultValues: { karigarId: "", description: "", issueWeight: 0 },
  });

  const fetchData = async () => {
    const [karigarRes, jobRes] = await Promise.all([getKarigars(), getJobWorks()]);
    if (karigarRes.success && karigarRes.data) setKarigars(karigarRes.data as unknown as KarigarRow[]);
    if (jobRes.success && jobRes.data) setJobWorks(jobRes.data as unknown as JobWorkRow[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function onKarigarSubmit(values: KarigarFormData) {
    setLoading(true);
    try {
      const result = await addKarigar(values);
      if (result.success) {
        setKarigarOpen(false);
        karigarForm.reset();
        fetchData();
      } else {
        alert(result.error || "Failed to add karigar");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function onJobSubmit(values: JobWorkFormData) {
    setLoading(true);
    try {
      const result = await addJobWork(values);
      if (result.success) {
        setJobOpen(false);
        jobForm.reset();
        fetchData();
      } else {
        alert(result.error || "Failed to create job work");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteKarigar(id: string) {
    if (!confirm("Delete this karigar?")) return;
    setDeletingId(id);
    try {
      const result = await deleteKarigar(id);
      if (result.success) fetchData();
      else alert(result.error || "Failed to delete");
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStatusUpdate(id: string, status: JobStatus) {
    setUpdatingId(id);
    try {
      const result = await updateJobStatus(id, status);
      if (result.success) fetchData();
      else alert(result.error || "Failed to update");
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Karigar (Artisans)</h2>
          <p className="text-muted-foreground">
            Manage job work, gold issue, and artisan ledgers.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Add Karigar Dialog */}
          <Dialog open={karigarOpen} onOpenChange={setKarigarOpen}>
            <DialogTrigger
              render={<Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Add Karigar</Button>}
            />
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Karigar</DialogTitle>
                <DialogDescription>Register a new artisan / karigar.</DialogDescription>
              </DialogHeader>
              <Form {...karigarForm}>
                <form onSubmit={karigarForm.handleSubmit(onKarigarSubmit)} className="space-y-4 mt-2">
                  <FormField<KarigarFormData> control={karigarForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Karigar name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField<KarigarFormData> control={karigarForm.control} name="mobile" render={({ field }) => (
                    <FormItem><FormLabel>Mobile</FormLabel><FormControl><Input placeholder="9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField<KarigarFormData> control={karigarForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="Address" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setKarigarOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Issue Gold / New Job Dialog */}
          <Dialog open={jobOpen} onOpenChange={setJobOpen}>
            <DialogTrigger
              render={<Button className="gap-2"><Plus className="h-4 w-4" />Issue Gold</Button>}
            />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Issue Gold / New Job</DialogTitle>
                <DialogDescription>Create a new job work and issue gold to a karigar.</DialogDescription>
              </DialogHeader>
              <Form {...jobForm}>
                <form onSubmit={jobForm.handleSubmit(onJobSubmit)} className="space-y-4 mt-2">
                  <FormField<JobWorkFormData> control={jobForm.control} name="karigarId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karigar</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                          <option value="">Select karigar</option>
                          {karigars.map((k) => (<option key={k.id} value={k.id}>{k.name} ({k.mobile})</option>))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField<JobWorkFormData> control={jobForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., 22K Gold Necklace" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField<JobWorkFormData> control={jobForm.control} name="issueWeight" render={({ field }) => (
                    <FormItem><FormLabel>Issue Weight (g)</FormLabel><FormControl><Input type="number" step="0.001" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setJobOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Job
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Karigars List */}
      <Card>
        <CardHeader>
          <CardTitle>Karigars</CardTitle>
          <CardDescription>Registered artisans and their job counts.</CardDescription>
        </CardHeader>
        <CardContent>
          {karigars.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              No karigars found. Click &quot;Add Karigar&quot; to register one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Outstanding (₹)</TableHead>
                    <TableHead className="text-center">Jobs</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {karigars.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell>{k.mobile}</TableCell>
                      <TableCell className="text-muted-foreground">{k.address || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{Number(k.outstandingBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">{k._count.jobWorks}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteKarigar(k.id)} disabled={deletingId === k.id}>
                          {deletingId === k.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Works Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Works</CardTitle>
          <CardDescription>Track gold issued and jobs currently in progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {jobWorks.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              No active jobs found. Click &quot;Issue Gold&quot; to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Karigar</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Issue Wt (g)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Receive Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobWorks.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{job.jobNumber}</Badge>
                      </TableCell>
                      <TableCell>{job.karigar.name}</TableCell>
                      <TableCell>{job.description}</TableCell>
                      <TableCell className="text-right">{Number(job.issueWeight).toFixed(3)}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[job.status] || "outline"}>
                          {job.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(job.issueDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job.receiveDate ? new Date(job.receiveDate).toLocaleDateString("en-IN") : "—"}
                      </TableCell>
                      <TableCell>
                        {nextStatus[job.status] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(job.id, nextStatus[job.status])}
                            disabled={updatingId === job.id}
                          >
                            {updatingId === job.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              `→ ${nextStatus[job.status].replace("_", " ")}`
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


