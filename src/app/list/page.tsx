"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  Table,
  Button,
  Badge,
  Group,
  Loader,
  Center,
  Stack,
  ActionIcon,
  Modal,
} from "@mantine/core";
import { IconFile, IconFileTypeXls, IconFileTypeCsv, IconPlayerPlay, IconRefresh, IconTrash } from "@tabler/icons-react";

interface FileMetadata {
  fileName: string;
  separator?: string;
  fileType?: string;
  uploadedAt?: string;
  originalName?: string;
  realName?: string;
  uuid: string;
}

export default function ListPage() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileMetadata | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/v2/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleProcess = (uuid: string) => {
    router.push(`/proses/${uuid}`);
  };

  const handleDeleteClick = (file: FileMetadata) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/v2/api/file/${fileToDelete.uuid}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Remove from local state
        setFiles(files.filter(f => f.uuid !== fileToDelete.uuid));
        setDeleteModalOpen(false);
        setFileToDelete(null);
      } else {
        console.error("Failed to delete file");
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType?: string) => {
    if (fileType === "excel") {
      return <IconFileTypeXls size={20} color="#1c7a3e" />;
    } else if (fileType === "csv") {
      return <IconFileTypeCsv size={20} color="#f57c00" />;
    }
    return <IconFile size={20} />;
  };

  const getFileTypeBadge = (fileType?: string) => {
    if (fileType === "excel") {
      return <Badge color="green" variant="light">Excel</Badge>;
    } else if (fileType === "csv") {
      return <Badge color="orange" variant="light">CSV</Badge>;
    }
    return <Badge color="gray" variant="light">Unknown</Badge>;
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center style={{ minHeight: "60vh" }}>
          <Stack align="center" spacing="md">
            <Loader size="lg" variant="dots" />
            <Text color="dimmed">Loading files...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Container size="xl" py="xl">
        <Paper shadow="sm" radius="md" p="xl" withBorder>
          <Group position="apart" mb="xl">
            <div>
              <Title order={2} mb="xs">
                File List
              </Title>
              <Text size="sm" color="dimmed">
                View and reprocess your uploaded files
              </Text>
            </div>
            <ActionIcon
              size="lg"
              variant="light"
              color="blue"
              onClick={fetchFiles}
              title="Refresh list"
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>

          {files.length === 0 ? (
            <Center style={{ minHeight: "40vh" }}>
              <Stack align="center" spacing="md">
                <IconFile size={64} color="#adb5bd" />
                <Text size="lg" weight={500} color="dimmed">
                  No files found
                </Text>
                <Text size="sm" color="dimmed" align="center">
                  Upload a file to get started
                </Text>
                <Button
                  variant="light"
                  onClick={() => router.push("/")}
                  mt="md"
                >
                  Go to Upload
                </Button>
              </Stack>
            </Center>
          ) : (
            <Table striped highlightOnHover withBorder withColumnBorders>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Uploaded At</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.uuid}>
                    <td>
                      <Group spacing="xs">
                        {getFileIcon(file.fileType)}
                        <div>
                          <Text size="sm" weight={500}>
                            {file.realName || file.originalName || file.fileName}
                          </Text>
                          <Text size="xs" color="dimmed">
                            UUID: {file.uuid}
                          </Text>
                        </div>
                      </Group>
                    </td>
                    <td>{getFileTypeBadge(file.fileType)}</td>
                    <td>
                      <Text size="sm">{formatDate(file.uploadedAt)}</Text>
                    </td>
                    <td>
                      <Group position="center" spacing="xs">
                        <Button
                          size="sm"
                          variant="light"
                          color="blue"
                          leftIcon={<IconPlayerPlay size={16} />}
                          onClick={() => handleProcess(file.uuid)}
                        >
                          Process
                        </Button>
                        <ActionIcon
                          size="lg"
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteClick(file)}
                          title="Delete file"
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Paper>

        {/* Delete confirmation modal */}
        <Modal
          opened={deleteModalOpen}
          onClose={() => !deleting && setDeleteModalOpen(false)}
          title="Confirm Deletion"
          centered
        >
          <Stack spacing="md">
            <Text size="sm">
              Are you sure you want to delete this file?
            </Text>
            {fileToDelete && (
              <Paper p="sm" withBorder>
                <Text size="sm" weight={500}>
                  {fileToDelete.realName || fileToDelete.originalName || fileToDelete.fileName}
                </Text>
                <Text size="xs" color="dimmed">
                  UUID: {fileToDelete.uuid}
                </Text>
              </Paper>
            )}
            <Text size="xs" color="red">
              This action cannot be undone. The file and its metadata will be permanently deleted.
            </Text>
            <Group position="right" spacing="xs">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={handleDeleteConfirm}
                loading={deleting}
              >
                Delete
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </div>
  );
}
