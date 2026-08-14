'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Users, Plus, Pencil, ShieldBan, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminService } from '@/services/adminService';
import { UserDto, CreateUserDto, UpdateUserDto } from '@/types/admin';
import { IconButton } from '@/components/ui/IconButton';
import { Pagination } from '@/components/ui/Pagination';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/hooks/useToast';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Teacher', 'Student', 'Admin'])
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address')
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserDto | null>(null);
  const toast = useToast();
  
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema)
  });

  const updateForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema)
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(roleFilter || undefined, {
        search: searchTerm || undefined,
        page,
        pageSize
      });
      setUsers(data.items);
      setTotalCount(data.totalCount);
      setError(null);
    } catch (err: any) {
      if (err.name === 'ApiError') {
        setError(err.message);
      } else {
        setError('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [roleFilter, searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, searchTerm]);

  const handleCreate = async (data: CreateUserForm) => {
    try {
      await adminService.createUser(data);
      setIsCreateModalOpen(false);
      createForm.reset();
      loadUsers();
      toast.success('User created successfully.');
    } catch (err: any) {
      if (err.name === 'ApiError') {
        createForm.setError('root', { message: err.message });
      } else {
        createForm.setError('root', { message: 'Failed to create user' });
      }
    }
  };

  const handleEditClick = (user: UserDto) => {
    setSelectedUser(user);
    updateForm.reset({ name: user.name, email: user.email });
    setIsUpdateModalOpen(true);
  };

  const handleUpdate = async (data: UpdateUserForm) => {
    if (!selectedUser) return;
    try {
      await adminService.updateUser(selectedUser.id, data);
      setIsUpdateModalOpen(false);
      setSelectedUser(null);
      loadUsers();
      toast.success('User updated successfully.');
    } catch (err: any) {
      if (err.name === 'ApiError') {
        updateForm.setError('root', { message: err.message });
      } else {
        updateForm.setError('root', { message: 'Failed to update user' });
      }
    }
  };

  const handleToggleClick = (user: UserDto) => {
    if (user.role === 'Admin') {
      toast.error("Cannot deactivate Admin users.");
      return;
    }
    setUserToToggle(user);
    setConfirmToggleOpen(true);
  };

  const executeToggleActive = async () => {
    if (!userToToggle) return;
    
    setIsToggling(prev => ({ ...prev, [userToToggle.id]: true }));
    try {
      await adminService.toggleUserActiveStatus(userToToggle.id);
      toast.success(`User ${userToToggle.isActive ? 'deactivated' : 'activated'} successfully.`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.name === 'ApiError' ? err.message : `Failed to change user status`);
    } finally {
      setIsToggling(prev => ({ ...prev, [userToToggle.id]: false }));
      setConfirmToggleOpen(false);
      setUserToToggle(null);
    }
  };

  return (
    <AppShell requireRole="Admin">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage system users, roles, and status.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="mb-6 flex gap-4">
        <Input 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'Admin', label: 'Admins' },
            { value: 'Teacher', label: 'Teachers' },
            { value: 'Student', label: 'Students' }
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : users.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No users found" 
          message="Try adjusting your search or filters, or add a new user." 
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'Teacher' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <IconButton 
                      icon={<Pencil className="h-4 w-4" />} 
                      aria-label="Edit User" 
                      title="Edit User" 
                      variant="primary" 
                      onClick={() => handleEditClick(user)} 
                    />
                    {user.role !== 'Admin' && (
                      <Switch 
                        checked={user.isActive} 
                        onChange={() => handleToggleClick(user)} 
                        disabled={isToggling[user.id]} 
                        label={user.isActive ? 'Active' : 'Inactive'} 
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create User Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add User">
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
          <Input label="Name" {...createForm.register('name')} error={createForm.formState.errors.name?.message} />
          <Input label="Email" type="email" {...createForm.register('email')} error={createForm.formState.errors.email?.message} />
          <Input label="Password" type="password" {...createForm.register('password')} error={createForm.formState.errors.password?.message} />
          <Select 
            label="Role" 
            options={[
              { value: '', label: 'Select role' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Teacher', label: 'Teacher' },
              { value: 'Student', label: 'Student' }
            ]}
            {...createForm.register('role')} 
            error={createForm.formState.errors.role?.message} 
          />
          {createForm.formState.errors.root && (
            <div className="text-sm text-red-600">{createForm.formState.errors.root.message}</div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createForm.formState.isSubmitting}>Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Update User Modal */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Edit User">
        <form onSubmit={updateForm.handleSubmit(handleUpdate)} className="space-y-4">
          <Input label="Name" {...updateForm.register('name')} error={updateForm.formState.errors.name?.message} />
          <Input label="Email" type="email" {...updateForm.register('email')} error={updateForm.formState.errors.email?.message} />
          <p className="text-xs text-gray-500">Note: Passwords and Roles cannot be changed here.</p>
          {updateForm.formState.errors.root && (
            <div className="text-sm text-red-600">{updateForm.formState.errors.root.message}</div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={updateForm.formState.isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmToggleOpen}
        title={userToToggle?.isActive ? 'Deactivate User?' : 'Activate User?'}
        description={userToToggle?.isActive ? 'Are you sure you want to deactivate this user?' : 'Are you sure you want to activate this user?'}
        confirmText={userToToggle?.isActive ? 'Deactivate' : 'Activate'}
        onConfirm={executeToggleActive}
        onCancel={() => {
          setConfirmToggleOpen(false);
          setUserToToggle(null);
        }}
        loading={userToToggle ? isToggling[userToToggle.id] : false}
      />
    </AppShell>
  );
}
