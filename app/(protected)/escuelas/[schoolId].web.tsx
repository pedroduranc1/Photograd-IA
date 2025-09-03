import React, { useState } from 'react';
import { View, FlatList, Alert, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { SearchInput } from '~/src/components/ui/search-input';
import { Card } from '~/src/components/ui/card';
import { CreateGradeModal } from '~/src/components/ui/create-grade-modal';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { useSchool } from '~/src/hooks/data/use-school-queries';
import { useSchoolGrades, useCreateGrade } from '~/src/hooks/data/use-grade-queries';
import type { GradeWithStats } from '~/src/types/database';
import { GraduationCap } from '~/src/components/ui/icons/GraduationCap';
import { User } from '~/src/components/ui/icons/User';
import { CreditCard } from '~/src/components/ui/icons/CreditCard';
import { Phone } from '~/src/components/ui/icons/Phone';
import { Mail } from '~/src/components/ui/icons/Mail';
import { MapPin } from '~/src/components/ui/icons/MapPin';
import { Edit } from '~/src/components/ui/icons/Edit';

export default function SchoolDetailScreenWeb() {
  const { schoolId } = useLocalSearchParams<{ schoolId: string }>();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGradeModal, setShowCreateGradeModal] = useState(false);

  // Queries
  const { 
    data: school, 
    isLoading: schoolLoading, 
    error: schoolError,
    refetch: refetchSchool 
  } = useSchool(schoolId);
  
  const { 
    data: gradesData, 
    isLoading: gradesLoading, 
    error: gradesError,
    refetch: refetchGrades 
  } = useSchoolGrades(schoolId, { limit: 50 });

  const createGradeMutation = useCreateGrade();
  
  const grades = gradesData?.data || [];

  const filteredGrades = grades.filter(grade =>
    grade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    grade.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchSchool(), refetchGrades()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleGradePress = (grade: GradeWithStats) => {
    router.push(`/(protected)/escuelas/${schoolId}/grados/${grade.id}`);
  };

  const handleAddGrade = () => {
    setShowCreateGradeModal(true);
  };

  const handleCreateGrade = async (gradeData: any) => {
    try {
      await createGradeMutation.mutateAsync(gradeData);
      setShowCreateGradeModal(false);
      Alert.alert('Éxito', 'Grado creado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el grado. Inténtalo de nuevo.');
    }
  };

  const isLoading = schoolLoading || gradesLoading;
  const hasError = schoolError || gradesError;

  const renderGradeCard = ({ item: grade }: { item: GradeWithStats }) => (
    <TouchableOpacity
      onPress={() => handleGradePress(grade)}
      className="flex-1 m-2 min-w-[280px] max-w-[350px]"
      accessibilityRole="button"
      accessibilityLabel={`View grade ${grade.name}`}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground mb-1">
                {grade.name}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Nivel: {grade.level}
              </Text>
            </View>
            <View className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
              <GraduationCap size={24} className="text-blue-600 dark:text-blue-400" />
            </View>
          </View>

          {/* Stats */}
          <View className="flex-1 justify-center">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {grade.studentCount || 0}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Estudiantes
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${grade.revenue || 0}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Ingresos
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="border-t border-blue-200 dark:border-blue-700 pt-3 mt-auto">
            <Text className="text-xs text-center text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <GraduationCap size={64} className="text-muted-foreground mb-6" />
      <Text className="text-2xl font-semibold text-foreground mb-2 text-center">
        {searchQuery ? 'No se encontraron grados' : 'No hay grados registrados'}
      </Text>
      <Text className="text-muted-foreground text-center mb-8 max-w-md">
        {searchQuery
          ? `No encontramos grados que coincidan con "${searchQuery}"`
          : 'Comienza agregando el primer grado a esta escuela para gestionar estudiantes'}
      </Text>
      {!searchQuery && (
        <Button onPress={handleAddGrade} size="lg" className="px-8">
          <Text className="text-primary-foreground font-medium">
            + Agregar Primer Grado
          </Text>
        </Button>
      )}
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator 
          size="large" 
          color={isDarkColorScheme ? '#22C55E' : '#16A34A'} 
        />
        <Text className="text-muted-foreground mt-4">
          Cargando información de la escuela...
        </Text>
      </View>
    );
  }

  // Error state
  if (hasError) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-xl font-semibold text-foreground mb-2 text-center">
          Error al cargar datos
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          {(schoolError || gradesError)?.message || 'Ha ocurrido un error inesperado'}
        </Text>
        <Button onPress={handleRefresh}>
          <Text className="text-primary-foreground">Reintentar</Text>
        </Button>
      </View>
    );
  }

  // School not found
  if (!school) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-xl font-semibold text-foreground mb-2 text-center">
          Escuela no encontrada
        </Text>
        <Text className="text-muted-foreground text-center mb-6">
          La escuela que buscas no existe o ha sido eliminada.
        </Text>
        <Button onPress={() => router.back()}>
          <Text className="text-primary-foreground">Volver</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* School Info Header */}
      <View className="p-6 border-b border-slate-200 dark:border-slate-700">
        <View className="flex-row">
          {/* Left Column - School Details */}
          <View className="flex-1 mr-8">
            <Text className="text-3xl font-bold text-foreground mb-2">
              {school.name}
            </Text>
            
            <View className="space-y-2 mb-4">
              <View className="flex-row items-center">
                <MapPin size={16} className="text-muted-foreground mr-2" />
                <Text className="text-muted-foreground">{school.address}</Text>
              </View>
              
              {school.phone && (
                <TouchableOpacity className="flex-row items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded">
                  <Phone size={16} className="text-muted-foreground mr-2" />
                  <Text className="text-muted-foreground">{school.phone}</Text>
                </TouchableOpacity>
              )}
              
              {school.email && (
                <TouchableOpacity className="flex-row items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1 rounded">
                  <Mail size={16} className="text-muted-foreground mr-2" />
                  <Text className="text-muted-foreground">{school.email}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Right Column - Stats & Actions */}
          <View className="min-w-[300px]">
            <View className="grid grid-cols-3 gap-4 mb-4">
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredGrades.length}
                </Text>
                <Text className="text-xs text-blue-700 dark:text-blue-300">
                  Grados
                </Text>
              </Card>
              
              <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {school.totalStudents || 0}
                </Text>
                <Text className="text-xs text-green-700 dark:text-green-300">
                  Estudiantes
                </Text>
              </Card>
              
              <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                <Text className={`text-2xl font-bold ${
                  (school.debtAmount || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'
                }`}>
                  ${school.debtAmount || 0}
                </Text>
                <Text className="text-xs text-purple-700 dark:text-purple-300">
                  Deuda
                </Text>
              </Card>
            </View>

            <View className="flex-row space-x-2">
              <Button variant="outline" className="flex-1">
                <Edit size={16} className="text-current mr-2" />
                <Text>Editar</Text>
              </Button>
              
              <Button onPress={handleAddGrade} className="flex-1">
                <Text className="text-primary-foreground">+ Agregar Grado</Text>
              </Button>
            </View>
          </View>
        </View>

        {/* Search */}
        <View className="mt-6">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar grados por nombre o nivel..."
            className="max-w-md"
          />
        </View>
      </View>

      {/* Grades Content */}
      <View className="flex-1">
        {filteredGrades.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredGrades}
            renderItem={renderGradeCard}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={{
              padding: 24,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={isDarkColorScheme ? '#22C55E' : '#16A34A'}
              />
            }
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={12}
            windowSize={10}
          />
        )}
      </View>

      {/* Create Grade Modal */}
      <CreateGradeModal
        visible={showCreateGradeModal}
        onClose={() => setShowCreateGradeModal(false)}
        onSave={handleCreateGrade}
        schoolId={schoolId}
        isLoading={createGradeMutation.isPending}
      />
    </View>
  );
}