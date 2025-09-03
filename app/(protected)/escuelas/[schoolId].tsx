import React, { useState } from 'react';
import { View, FlatList, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '~/src/components/ui/text';
import { Button } from '~/src/components/ui/button';
import { SearchInput } from '~/src/components/ui/search-input';
import { GradeCard } from '~/src/components/ui/grade-card';
import { Fab } from '~/src/components/ui/fab';
import { BreadcrumbNavigation } from '~/src/components/ui/breadcrumb-navigation';
import { CreateGradeModal } from '~/src/components/ui/create-grade-modal';
import { useColorScheme } from '~/src/hooks/ui/useColorScheme';
import { useSchool } from '~/src/hooks/data/use-school-queries';
import { useSchoolGrades, useCreateGrade } from '~/src/hooks/data/use-grade-queries';
import type { GradeWithStats } from '~/src/types/database';
import { generateId } from '~/src/utils/id-generator';

export default function SchoolDetailScreen() {
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
      const newGrade = {
        ...gradeData,
        id: generateId.grade(),
      };
      await createGradeMutation.mutateAsync(newGrade);
      setShowCreateGradeModal(false);
      Alert.alert('Éxito', 'Grado creado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el grado. Inténtalo de nuevo.');
      console.error('Error creating grade:', error);
    }
  };

  const isLoading = schoolLoading || gradesLoading;
  const hasError = schoolError || gradesError;

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Text className="text-6xl mb-4">📚</Text>
      <Text className="text-xl font-semibold text-foreground mb-2 text-center">
        {searchQuery ? 'No se encontraron grados' : 'No hay grados registrados'}
      </Text>
      <Text className="text-muted-foreground text-center mb-6">
        {searchQuery
          ? `No encontramos grados que coincidan con "${searchQuery}"`
          : 'Comienza agregando el primer grado a esta escuela'}
      </Text>
      {!searchQuery && (
        <View className="w-32">
          <Button onPress={handleAddGrade} className="w-full">
            <Text className="text-primary-foreground font-medium">
              Agregar Grado
            </Text>
          </Button>
        </View>
      )}
    </View>
  );

  const renderGradeItem = ({ item }: { item: GradeWithStats }) => (
    <GradeCard
      grade={item}
      onPress={() => handleGradePress(item)}
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator 
            size="large" 
            color={isDarkColorScheme ? '#22C55E' : '#16A34A'} 
          />
          <Text className="text-muted-foreground mt-4">
            Cargando información...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (hasError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
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
      </SafeAreaView>
    );
  }

  // School not found
  if (!school) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center px-6">
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
      </SafeAreaView>
    );
  }

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
            label: school.name,
            isActive: true,
          },
        ]}
      />
      
      {/* School Header */}
      <View className="px-6 pb-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-1">
            {school.name}
          </Text>
          <Text className="text-muted-foreground mb-2">
            {school.address}
          </Text>
          <Text className="text-muted-foreground">
            {filteredGrades.length} {filteredGrades.length === 1 ? 'grado' : 'grados'} • 
            {school.studentCount} estudiantes
          </Text>
        </View>
        
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre o nivel..."
        />
      </View>

      {/* Grades List */}
      <FlatList
        data={filteredGrades}
        renderItem={renderGradeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 100, // Space for FAB
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={isDarkColorScheme ? '#22C55E' : '#16A34A'}
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Floating Action Button */}
      <Fab 
        onPress={handleAddGrade}
        disabled={createGradeMutation.isPending}
      />

      {/* Create Grade Modal */}
      <CreateGradeModal
        visible={showCreateGradeModal}
        onClose={() => setShowCreateGradeModal(false)}
        onSave={handleCreateGrade}
        schoolId={schoolId}
        isLoading={createGradeMutation.isPending}
      />
      </View>
    </SafeAreaView>
  );
}