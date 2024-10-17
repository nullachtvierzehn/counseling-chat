--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: consultations; Type: TABLE DATA; Schema: app_public; Owner: counseling_owner
--

INSERT INTO app_public.consultations (id, organization_id, name, created_at, updated_at) VALUES
	('b4374be6-be46-43db-9dfb-1fef8f7a3bf8', 'fd3bbe58-da5a-4dcd-b306-41c31997230a', 'Beratung von Timo', '2024-10-17 08:40:18.400863+02', '2024-10-17 08:40:18.400863+02');


--
-- Data for Name: consultation_participants; Type: TABLE DATA; Schema: app_public; Owner: counseling_owner
--



--
-- Data for Name: folders; Type: TABLE DATA; Schema: app_public; Owner: counseling_owner
--

INSERT INTO app_public.folders (id, organization_id, parent_id, name, created_at, updated_at) VALUES
	('305c7da2-8bcc-11ef-b3a9-03772b451ac2', 'fd3bbe58-da5a-4dcd-b306-41c31997230a', NULL, 'Test', '2024-10-16 16:37:37.272065+02', '2024-10-16 16:37:37.272065+02'),
	('44085696-8bcc-11ef-b3a9-4f065ca2fa87', 'fd3bbe58-da5a-4dcd-b306-41c31997230a', '305c7da2-8bcc-11ef-b3a9-03772b451ac2', 'Unterordner', '2024-10-16 16:38:10.27592+02', '2024-10-16 16:38:10.27592+02'),
	('55903280-8bcc-11ef-b3a9-43407c41a602', 'fd3bbe58-da5a-4dcd-b306-41c31997230a', '44085696-8bcc-11ef-b3a9-4f065ca2fa87', 'Unterunterordner', '2024-10-16 16:38:39.687558+02', '2024-10-16 16:38:39.687558+02');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: app_public; Owner: counseling_owner
--



--
-- Data for Name: message_body_revisions; Type: TABLE DATA; Schema: app_public; Owner: counseling_owner
--



--
-- Data for Name: message_body_revision_approvals; Type: TABLE DATA; Schema: app_public; Owner: counseling_owner
--



--
-- Data for Name: message_body_revision_comments; Type: TABLE DATA; Schema: app_public; Owner: counseling_owner
--



--
-- PostgreSQL database dump complete
--

