import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { refreshUserData } = useAuth();
  const [newUser, setNewUser] = useState({
    firstName: '', middleName: '', lastName: '', email: '', password: '', contactNumber: '', barangay: '', role: 'Secretary'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ');
          return { id: docSnap.id, ...data, fullName };
        })
        .filter(u => ['Secretary', 'OfficeStaff'].includes(u.role));
      setUsers(usersData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully.');
      fetchUsers();
      refreshUserData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user.');
    }
  };

  const handleSaveEdit = async (selectedUser) => {
    if (!selectedUser?.id) return;
    try {
      setSaving(true);
      const { id, fullName, ...data } = selectedUser;
      await updateDoc(doc(db, 'users', id), data);
      toast.success('User updated successfully.');
      fetchUsers();
      refreshUserData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user.');
    } finally { setSaving(false); }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          displayName: `${newUser.firstName} ${newUser.middleName || ''} ${newUser.lastName}`.trim(),
          role: newUser.role
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Failed to create user.');
      await setDoc(doc(db, 'users', data.uid), newUser);
      toast.success('User created successfully!');
      setNewUser({ firstName: '', middleName: '', lastName: '', email: '', password: '', contactNumber: '', barangay: '', role: 'Secretary' });
      fetchUsers();
      refreshUserData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Something went wrong.');
    } finally { setSaving(false); }
  };

  return { users, loading, fetchUsers, handleDelete, handleSaveEdit, handleAddUser, saving, newUser, setNewUser };
};

export default useUsers;
