import React, { useState } from 'react';
import { View, ScrollView, Alert, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { Card } from '~/src/components/ui/card';
import { StudentDetail } from '~/src/components/ui/student-detail';
import { BreadcrumbNavigation } from '~/src/components/ui/breadcrumb-navigation';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { useStudent, useDeleteStudent } from '~/src/hooks/data/use-student-queries';
import { useStudentPhotosById, useStudentPayments } from '~/src/hooks/data/use-school-management-queries';

export default function StudentDetailScreen() {
  const { schoolId, gradeId, studentId } = useLocalSearchParams<{ 
    schoolId: string; 
    gradeId: string;
    studentId: string;
  }>();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  
  // Fetch student data using real hooks
  const { 
    data: student, 
    isLoading: studentLoading, 
    error: studentError, 
    refetch: refetchStudent 
  } = useStudent(studentId);
  
  // Fetch related data
  const { 
    data: photosData, 
    isLoading: photosLoading, 
    refetch: refetchPhotos 
  } = useStudentPhotosById(studentId, { limit: 5 });
  
  const { 
    data: paymentsData, 
    isLoading: paymentsLoading, 
    refetch: refetchPayments 
  } = useStudentPayments(studentId, { limit: 5, orderBy: 'paymentDate', orderDirection: 'desc' });
  
  // Delete mutation
  const deleteStudentMutation = useDeleteStudent();
  
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStudent(),
        refetchPhotos(),
        refetchPayments(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = () => {
    Alert.alert('Editar Estudiante', 'Funcionalidad en desarrollo...');
  };

  const handleDelete = () => {
    if (!student) return;
    
    Alert.alert(
      'Eliminar Estudiante',
      `¿Estás seguro de que quieres eliminar a "${student.fullName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudentMutation.mutateAsync(studentId);
              Alert.alert('Éxito', 'Estudiante eliminado correctamente');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el estudiante. Por favor, intenta de nuevo.');
            }
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

  // Loading state
  if (studentLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDarkColorScheme ? '#22C55E' : '#16A34A'} />
          <Text className="text-muted-foreground mt-4">Cargando estudiante...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (studentError || !student) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-xl font-semibold text-foreground mb-4 text-center">
            {studentError ? 'Error al cargar estudiante' : 'Estudiante no encontrado'}
          </Text>
          <Text className="text-muted-foreground text-center mb-6">
            {studentError 
              ? 'Hubo un problema al cargar los datos del estudiante.' 
              : 'El estudiante que buscas no existe o ha sido eliminado.'
            }
          </Text>
          <Button onPress={() => router.back()} variant="outline">
            <Text>Volver</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Combine student data with photos and payments
  const studentWithDetails = {
    ...student,
    recentPhotos: photosData?.data || [],
    recentPayments: paymentsData?.data || [],
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          items={[
            {
              label: 'Escuelas',
              onPress: () => router.push('/(protected)/escuelas'),
            },
            {
              label: studentWithDetails.school?.name || 'Escuela',
              onPress: () => router.push(`/(protected)/escuelas/${schoolId}`),
            },
            {
              label: studentWithDetails.grade?.name || 'Grado',
              onPress: () => router.push(`/(protected)/escuelas/${schoolId}/grados/${gradeId}`),
            },
            {
              label: studentWithDetails.fullName,
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
          student={studentWithDetails}
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
    </SafeAreaView>
  );
}