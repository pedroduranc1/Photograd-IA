import React, { useState } from 'react';
import { View, ScrollView, Alert, RefreshControl, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { Card } from '~/src/components/ui/card';
import { StudentDetail } from '~/src/components/ui/student-detail';
import { BreadcrumbNavigation } from '~/src/components/ui/breadcrumb-navigation';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';

// Mock data - will be replaced with actual data hooks
const mockStudent = {
  id: '1',
  schoolId: '1',
  gradeId: '1',
  firstName: 'María',
  lastName: 'García López',
  studentId: 'EST001',
  email: 'maria.garcia@email.com',
  phone: '(55) 1234-5678',
  address: 'Calle Principal 123, Col. Centro, CDMX',
  birthDate: '2015-03-15',
  gender: 'female' as const,
  emergencyContactName: 'Carmen López García',
  emergencyContactPhone: '(55) 9876-5432',
  status: 'active' as const,
  enrollmentDate: '2024-09-01',
  notes: 'Estudiante destacado en matemáticas y ciencias.',
  fullName: 'María García López',
  age: 9,
  photoCount: 5,
  paymentCount: 3,
  totalDebt: 0,
  school: {
    id: '1',
    name: 'Universidad Nacional',
    address: 'Av. Universidad 3000, Coyoacán, CDMX',
    phone: '(55) 5622-0000',
    email: 'contacto@unam.mx',
  },
  grade: {
    id: '1',
    name: '1° Primaria',
    level: 'Primaria',
    academicYear: '2024-2025',
  },
  recentPhotos: [
    {
      id: '1',
      studentId: '1',
      photoUrl: 'https://via.placeholder.com/150',
      photoType: 'profile' as const,
      takenDate: '2024-12-15',
    },
    {
      id: '2',
      studentId: '1',
      photoUrl: 'https://via.placeholder.com/150',
      photoType: 'graduation' as const,
      takenDate: '2024-12-10',
    },
  ],
  recentPayments: [
    {
      id: '1',
      studentId: '1',
      amount: 2500,
      paymentType: 'tuition' as const,
      paymentMethod: 'card' as const,
      paymentDate: '2024-12-01',
      status: 'paid' as const,
      description: 'Colegiatura Diciembre 2024',
    },
    {
      id: '2',
      studentId: '1',
      amount: 500,
      paymentType: 'materials' as const,
      paymentMethod: 'cash' as const,
      paymentDate: '2024-11-15',
      status: 'paid' as const,
      description: 'Materiales escolares',
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export default function StudentDetailScreen() {
  const { schoolId, gradeId, studentId } = useLocalSearchParams<{ 
    schoolId: string; 
    gradeId: string;
    studentId: string;
  }>();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  
  const [student] = useState(mockStudent);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleEdit = () => {
    Alert.alert('Editar Estudiante', 'Funcionalidad en desarrollo...');
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Estudiante',
      `¿Estás seguro de que quieres eliminar a "${student.fullName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Éxito', 'Estudiante eliminado correctamente');
            router.back();
          },
        },
      ]
    );
  };

  const handleAddPhoto = () => {
    Alert.alert('Agregar Foto', 'Funcionalidad en desarrollo...');
  };

  const handleAddPayment = () => {
    Alert.alert('Agregar Pago', 'Funcionalidad en desarrollo...');
  };

  const handleViewAllPhotos = () => {
    Alert.alert('Ver Todas las Fotos', 'Funcionalidad en desarrollo...');
  };

  const handleViewAllPayments = () => {
    Alert.alert('Ver Todos los Pagos', 'Funcionalidad en desarrollo...');
  };

  const handleCall = (phone: string) => {
    Alert.alert(
      'Llamar',
      `¿Deseas llamar a ${phone}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const handleEmail = (email: string) => {
    Alert.alert(
      'Enviar Email',
      `¿Deseas enviar un email a ${email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => Linking.openURL(`mailto:${email}`) },
      ]
    );
  };

  if (!student) {
    return (
      <View className="flex-1 bg-background pt-2 justify-center items-center px-6">
        <Text className="text-xl font-semibold text-foreground mb-4 text-center">
          Estudiante no encontrado
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          El estudiante que buscas no existe o ha sido eliminado.
        </Text>
        <Button onPress={() => router.back()} variant="outline">
          <Text>Volver</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation
        items={[
          {
            label: 'Escuelas',
            onPress: () => router.push('/(protected)/escuelas'),
          },
          {
            label: student.school.name,
            onPress: () => router.push(`/(protected)/escuelas/${schoolId}`),
          },
          {
            label: student.grade.name,
            onPress: () => router.push(`/(protected)/escuelas/${schoolId}/grados/${gradeId}`),
          },
          {
            label: student.fullName,
            isActive: true,
          },
        ]}
      />
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkColorScheme ? '#22C55E' : '#16A34A'}
          />
        }
      >
        <StudentDetail
          student={student}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddPhoto={handleAddPhoto}
          onAddPayment={handleAddPayment}
          onViewAllPhotos={handleViewAllPhotos}
          onViewAllPayments={handleViewAllPayments}
          onCall={handleCall}
          onEmail={handleEmail}
        />
      </ScrollView>
    </View>
  );
}