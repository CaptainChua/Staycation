"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, UserCircle, MessageSquare, Loader2 } from "lucide-react";
import Image from "next/image";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import { useCreateConversationMutation } from "@/redux/api/messagesApi";
import toast from "react-hot-toast";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onConversationCreated?: (conversationId: string) => void;
}

interface Employee {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  department?: string;
  profile_image_url?: string;
}

export default function NewMessageModal({
  isOpen,
  onClose,
  currentUserId,
  onConversationCreated,
}: NewMessageModalProps) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: employeesData, isLoading } = useGetEmployeesQuery({});
  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();

  const employees = useMemo(() => employeesData?.data || [], [employeesData?.data]);

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        onClose();
      }
    }

    if (!isOpen) return;

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees
      .filter((emp: Employee) => emp.id !== currentUserId)
      .filter((emp: Employee) => {
        if (!term) return true;
        const fullName = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.toLowerCase();
        const role = (emp.role ?? "").toLowerCase();
        const email = (emp.email ?? "").toLowerCase();
        return fullName.includes(term) || role.includes(term) || email.includes(term);
      });
  }, [employees, currentUserId, search]);

  // Don't render anything during SSR
  if (typeof window === "undefined") {
    return null;
  }

  if (!isOpen) return null;

  const handleCreateConversation = async () => {
    if (!selectedUser) {
      toast.error("Please select a user to message");
      return;
    }

    try {
      const conversationName = `${selectedUser.first_name ?? ""} ${selectedUser.last_name ?? ""}`.trim();
      const result = await createConversation({
        name: conversationName || selectedUser.email || "Conversation",
        type: "internal",
        participant_ids: [currentUserId, selectedUser.id],
      }).unwrap();

      toast.success("Conversation created!");

      if (onConversationCreated && result.data?.id) {
        onConversationCreated(result.data.id);
      }

      setSelectedUser(null);
      setSearch("");
      onClose();
    } catch (error: unknown) {
      console.error("Failed to create conversation:", error);
      const errorMessage = error && typeof error === 'object' && 'data' in error 
        ? (error as { data?: { error?: string } }).data?.error 
        : "Failed to create conversation";
      toast.error(errorMessage || "Failed to create conversation");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-brand-primary/20 dark:border-gray-800 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] text-brand-primary uppercase">New message</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Start a chat</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-brand-primaryLighter dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-300"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, or email..."
              className="w-full pl-10 pr-3 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="space-y-2">
              {filteredEmployees.map((employee: Employee) => {
                const isSelected = selectedUser?.id === employee.id;
                const fullName = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || employee.email || "Employee";
                const initials = `${(employee.first_name?.[0] ?? "").toUpperCase()}${(employee.last_name?.[0] ?? "").toUpperCase()}` || "?";

                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => setSelectedUser(employee)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all text-left flex items-center gap-4 ${
                      isSelected
                        ? "border-brand-primary bg-brand-primaryLighter/50 dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {employee.profile_image_url ? (
                      <Image
                        src={employee.profile_image_url}
                        alt={fullName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center">
                        {initials}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{fullName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {employee.role || "Staff"}
                        </span>
                        {employee.department && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{employee.department}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{employee.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="w-16 h-16 text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No staff members found</p>
              <p className="text-gray-400 text-sm">{search ? "Try a different search term" : "No employees available"}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {selectedUser ? (
              <span>
                Selected: <span className="font-semibold text-gray-900 dark:text-gray-100">{`${selectedUser.first_name ?? ""} ${selectedUser.last_name ?? ""}`.trim() || selectedUser.email}</span>
              </span>
            ) : (
              <span>Select a staff member to start messaging</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateConversation}
              disabled={!selectedUser || isCreating}
              className="px-5 py-2 rounded-lg bg-brand-primary text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Start
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}