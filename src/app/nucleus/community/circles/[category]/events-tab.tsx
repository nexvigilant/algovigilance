'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  CheckCircle2,
  QrCode,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import {
  listEvents,
  createEvent,
  updateEvent,
  checkInEvent,
  listEventAttendance,
  type OrgEvent,
  type CreateEventRequest,
  type EventAttendance,
  type EventChecklistItem,
  type EventStatus,
} from '@/lib/api/circles-org-api';
import { useAuth } from '@/hooks/use-auth';
import { CheckInButton, QRCodeDisplay } from './qr-checkin';

const STATUS_STYLES: Record<EventStatus, string> = {
  planning: 'border-amber-500/30 text-amber-400',
  scheduled: 'border-cyan/30 text-cyan',
  in_progress: 'border-emerald-500/30 text-emerald-400',
  completed: 'border-nex-light text-cyan-soft/50',
  cancelled: 'border-red-500/30 text-red-400',
};

function EventCard({
  event,
  circleId,
  onUpdate,
}: {
  event: OrgEvent;
  circleId: string;
  onUpdate: () => void;
}) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const daysUntil = Math.ceil((new Date(event.start_time).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPast = new Date(event.start_time) < new Date();
  const isLive = event.status === 'in_progress';

  const handleExpand = async () => {
    if (!expanded) {
      setLoadingAttendance(true);
      const res = await listEventAttendance(circleId, event.id);
      if (res.data) setAttendance(res.data);
      setLoadingAttendance(false);
    }
    setExpanded(!expanded);
  };

  const handleCheckIn = async () => {
    if (!user?.uid) return;
    setCheckingIn(true);
    const res = await checkInEvent(circleId, event.id, user.uid, 'manual');
    if (res.success) {
      const attRes = await listEventAttendance(circleId, event.id);
      if (attRes.data) setAttendance(attRes.data);
      onUpdate();
    }
    setCheckingIn(false);
  };

  const checklistDone = event.checklist.filter((c) => c.completed).length;

  return (
    <Card className={`border bg-nex-surface transition-colors ${isLive ? 'border-emerald-500/30' : 'border-nex-light hover:border-cyan/20'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{event.name}</h3>
              <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[event.status]}`}>
                {event.status === 'in_progress' ? 'LIVE' : event.status}
              </Badge>
              {event.event_type && (
                <Badge variant="outline" className="border-nex-light text-cyan-soft/40 text-[10px]">
                  {event.event_type}
                </Badge>
              )}
            </div>

            {/* Value-first: "Why should I attend?" before logistics */}
            {event.value_proposition && (
              <p className="mb-2 text-xs italic text-cyan-soft/70">
                &ldquo;{event.value_proposition}&rdquo;
              </p>
            )}

            {event.description && (
              <p className="mb-2 line-clamp-2 text-xs text-cyan-soft/50">{event.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-cyan-soft/40">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(event.start_time).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event.attendance_count}{event.capacity ? `/${event.capacity}` : ''} attended
              </span>
              {event.rsvp_count > 0 && (
                <span>{event.rsvp_count} RSVPs</span>
              )}
              {!isPast && daysUntil > 0 && (
                <span className="font-medium text-cyan">{daysUntil}d away</span>
              )}
            </div>
          </div>

          <div className="ml-3 flex shrink-0 flex-col items-end gap-2">
            {(isLive || event.status === 'scheduled') && (
              <CheckInButton
                circleId={circleId}
                eventId={event.id}
                eventName={event.name}
                compact
              />
            )}
            <button onClick={() => void handleExpand()} className="text-cyan-soft/40 hover:text-cyan">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-nex-light/50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Checklist */}
            {event.checklist.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-soft/60">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Checklist ({checklistDone}/{event.checklist.length})
                </h4>
                <div className="space-y-1.5">
                  {event.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <div className={`h-3.5 w-3.5 rounded-sm border ${item.completed ? 'border-emerald-500 bg-emerald-500/20' : 'border-nex-light'}`}>
                        {item.completed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <span className={item.completed ? 'text-cyan-soft/40 line-through' : 'text-cyan-soft/70'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-soft/60">
                <Users className="h-3.5 w-3.5" />
                Attendance ({attendance.length})
              </h4>
              {loadingAttendance ? (
                <p className="text-xs text-cyan-soft/40">Loading...</p>
              ) : attendance.length === 0 ? (
                <p className="text-xs text-cyan-soft/40">No check-ins yet</p>
              ) : (
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {attendance.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-cyan-soft/70">{a.user_display_name}</span>
                      <span className="text-cyan-soft/40">
                        {new Date(a.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {a.check_in_method === 'qr' && ' (QR)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QR Code for Check-In */}
            {(event.status === 'scheduled' || event.status === 'in_progress') && (
              <QRCodeDisplay eventId={event.id} eventName={event.name} circleId={circleId} />
            )}

            {/* Contacts */}
            {event.contacts.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold text-cyan-soft/60">Contacts</h4>
                <div className="space-y-1">
                  {event.contacts.map((c, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-white">{c.name}</span>
                      <span className="text-cyan-soft/40"> — {c.role}</span>
                      {c.organization && <span className="text-cyan-soft/40"> ({c.organization})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function CreateEventDialog({
  circleId,
  onCreated,
}: {
  circleId: string;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [valueProp, setValueProp] = useState('');
  const [eventType, setEventType] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !startTime || !user?.uid) return;
    setCreating(true);
    const req: CreateEventRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      value_proposition: valueProp.trim() || undefined,
      event_type: eventType || undefined,
      start_time: new Date(startTime).toISOString(),
      location: location.trim() || undefined,
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      created_by: user.uid,
    };
    const res = await createEvent(circleId, req);
    if (res.success) {
      setName(''); setDescription(''); setValueProp('');
      setEventType(''); setStartTime(''); setLocation(''); setCapacity('');
      setOpen(false);
      onCreated();
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-cyan-dark text-white hover:bg-cyan-dark/80">
          <Plus className="mr-1.5 h-4 w-4" /> New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="border-nex-light bg-nex-deep sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-nex-light bg-nex-surface text-white placeholder:text-cyan-soft/40"
          />
          <textarea
            placeholder="Why should someone attend? (shown first)"
            value={valueProp}
            onChange={(e) => setValueProp(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-cyan/30 bg-nex-surface p-2.5 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-nex-light bg-nex-surface p-2.5 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="border-nex-light bg-nex-surface text-sm text-white">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="community_service">Community Service</SelectItem>
                <SelectItem value="fundraiser">Fundraiser</SelectItem>
                <SelectItem value="rush">Rush</SelectItem>
                <SelectItem value="initiation">Initiation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border-nex-light bg-nex-surface text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-nex-light bg-nex-surface text-sm text-white placeholder:text-cyan-soft/40"
            />
            <Input
              type="number"
              placeholder="Capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="border-nex-light bg-nex-surface text-sm text-white placeholder:text-cyan-soft/40"
            />
          </div>
          <Button
            onClick={() => void handleCreate()}
            disabled={creating || !name.trim() || !startTime}
            className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80"
          >
            {creating ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Events Tab ───────────────────────────

interface EventsTabProps {
  circleId: string;
}

export function EventsTab({ circleId }: EventsTabProps) {
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
    const res = await listEvents(circleId, filters);
    if (res.data) setEvents(res.data);
    setLoading(false);
  }, [circleId, statusFilter]);

  useEffect(() => { void loadData(); }, [loadData]);

  const upcoming = events.filter((e) => new Date(e.start_time) >= new Date() && e.status !== 'cancelled');
  const past = events.filter((e) => new Date(e.start_time) < new Date() || e.status === 'completed');

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="h-32 animate-pulse border border-nex-light bg-nex-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 border-nex-light bg-nex-surface text-xs text-cyan-soft/60">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <CreateEventDialog circleId={circleId} onCreated={() => void loadData()} />
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-soft/50">
            Upcoming ({upcoming.length})
          </h3>
          <div className="space-y-3">
            {upcoming.map((e) => <EventCard key={e.id} event={e} circleId={circleId} onUpdate={() => void loadData()} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-soft/50">
            Past ({past.length})
          </h3>
          <div className="space-y-3">
            {past.map((e) => <EventCard key={e.id} event={e} circleId={circleId} onUpdate={() => void loadData()} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <Card className="border border-nex-light bg-nex-surface p-8 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-cyan-soft/30" />
          <p className="text-cyan-soft/60">No events yet. Create the first one.</p>
        </Card>
      )}
    </div>
  );
}
