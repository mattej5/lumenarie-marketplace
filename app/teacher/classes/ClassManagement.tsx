'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/lib/types';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Chip,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

interface ClassData {
  id: string;
  name: string;
  subject: string;
  school_year?: string;
  color_theme?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  user: User;
}

const SUBJECT_OPTIONS = [
  // Sciences
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'physics', label: 'Physics' },
  { value: 'earth-science', label: 'Earth Science' },
  { value: 'environmental-science', label: 'Environmental Science' },
  { value: 'astronomy', label: 'Astronomy' },
  { value: 'anatomy', label: 'Anatomy & Physiology' },
  { value: 'marine-biology', label: 'Marine Biology' },

  // Mathematics
  { value: 'algebra-1', label: 'Algebra I' },
  { value: 'algebra-2', label: 'Algebra II' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'trigonometry', label: 'Trigonometry' },
  { value: 'pre-calculus', label: 'Pre-Calculus' },
  { value: 'calculus', label: 'Calculus' },
  { value: 'statistics', label: 'Statistics' },

  // English/Language Arts
  { value: 'english-9', label: 'English 9' },
  { value: 'english-10', label: 'English 10' },
  { value: 'english-11', label: 'English 11' },
  { value: 'english-12', label: 'English 12' },
  { value: 'literature', label: 'Literature' },
  { value: 'creative-writing', label: 'Creative Writing' },
  { value: 'journalism', label: 'Journalism' },

  // Social Studies/History
  { value: 'world-history', label: 'World History' },
  { value: 'us-history', label: 'U.S. History' },
  { value: 'government', label: 'Government' },
  { value: 'civics', label: 'Civics' },
  { value: 'economics', label: 'Economics' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'sociology', label: 'Sociology' },
  { value: 'geography', label: 'Geography' },

  // Foreign Languages
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'mandarin', label: 'Mandarin Chinese' },
  { value: 'latin', label: 'Latin' },
  { value: 'japanese', label: 'Japanese' },

  // Arts
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'band', label: 'Band' },
  { value: 'choir', label: 'Choir' },
  { value: 'orchestra', label: 'Orchestra' },
  { value: 'drama', label: 'Drama/Theater' },
  { value: 'dance', label: 'Dance' },

  // Technology & Computer Science
  { value: 'computer-science', label: 'Computer Science' },
  { value: 'programming', label: 'Programming' },
  { value: 'web-design', label: 'Web Design' },
  { value: 'digital-media', label: 'Digital Media' },

  // Physical Education & Health
  { value: 'physical-education', label: 'Physical Education' },
  { value: 'health', label: 'Health' },

  // Career & Technical Education
  { value: 'business', label: 'Business' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'culinary', label: 'Culinary Arts' },
  { value: 'automotive', label: 'Automotive Technology' },
  { value: 'engineering', label: 'Engineering' },

  // Other
  { value: 'study-skills', label: 'Study Skills' },
  { value: 'other', label: 'Other' },
];

export default function ClassManagement({ user: _user }: Props) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    school_year: '',
    color_theme: '',
    active: true,
  });

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      if (response.ok) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenDialog = useCallback((classData?: ClassData) => {
    if (classData) {
      setSelectedClass(classData);
      setFormData({
        name: classData.name,
        subject: classData.subject,
        school_year: classData.school_year || '',
        color_theme: classData.color_theme || '',
        active: classData.active,
      });
    } else {
      setSelectedClass(null);
      setFormData({
        name: '',
        subject: '',
        school_year: '',
        color_theme: '',
        active: true,
      });
    }
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedClass(null);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const url = '/api/classes';
      const method = selectedClass ? 'PUT' : 'POST';
      const body = selectedClass
        ? { ...formData, id: selectedClass.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchClasses();
        handleCloseDialog();
      } else {
        alert('Failed to save class');
      }
    } catch (error) {
      console.error('Error saving class:', error);
      alert('An error occurred');
    }
  }, [selectedClass, formData, handleCloseDialog]);

  const handleDelete = useCallback(async () => {
    if (!selectedClass) return;

    try {
      const response = await fetch(`/api/classes?id=${selectedClass.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchClasses();
        setOpenDeleteDialog(false);
        setSelectedClass(null);
      } else {
        alert('Failed to delete class');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('An error occurred');
    }
  }, [selectedClass]);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Class Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'subject',
      headerName: 'Subject',
      width: 180,
      renderCell: (params) => {
        // Find the label for the subject
        const subjectOption = SUBJECT_OPTIONS.find(opt => opt.value === params.value);
        const label = subjectOption?.label || params.value;

        // Generate a consistent color based on subject value
        const getColorForSubject = (subject: string) => {
          const hash = subject.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
          }, 0);
          const hue = Math.abs(hash) % 360;
          return `hsl(${hue}, 65%, 50%)`;
        };

        const color = getColorForSubject(params.value);

        return (
          <Chip
            label={label}
            size="small"
            sx={{
              backgroundColor: color + '20',
              color: color,
            }}
          />
        );
      },
    },
    {
      field: 'school_year',
      headerName: 'School Year',
      width: 130,
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => handleOpenDialog(params.row as ClassData)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => {
            setSelectedClass(params.row as ClassData);
            setOpenDeleteDialog(true);
          }}
        />,
      ],
    },
  ], [handleOpenDialog]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
              <p className="text-gray-600 mt-1">Manage your classes</p>
            </div>
          </div>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
            }}
          >
            Add Class
          </Button>
        </div>
      </div>

      {/* DataGrid */}
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={classes}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f9fafb',
              },
            }}
          />
        </Box>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedClass ? 'Edit Class' : 'Create New Class'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Class Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              select
              label="Subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value as ClassData['subject'] })
              }
              fullWidth
              required
            >
              {SUBJECT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="School Year"
              value={formData.school_year}
              onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
              fullWidth
              placeholder="2024-2025"
            />
            <TextField
              label="Color Theme"
              value={formData.color_theme}
              onChange={(e) => setFormData({ ...formData, color_theme: e.target.value })}
              fullWidth
              placeholder="#4f46e5"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.subject}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
            }}
          >
            {selectedClass ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Class</DialogTitle>
        <DialogContent>
          Are you sure you want to delete &ldquo;{selectedClass?.name}&rdquo;? This action cannot be undone
          and will remove all associated data.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}