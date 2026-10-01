import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SubmitButton } from '../../components/SubmitButton';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch projects
  const { data: projects, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error("Error fetching projects:", fetchError.message);
  }

  async function addProject(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string;
    const targetDate = formData.get('target_date') as string;

    if (!title || !title.trim()) return;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const projectData: any = {
      title: title.trim(),
      description: description ? description.trim() : null,
      status: status || 'in_progress',
      user_id: user.id
    };

    if (targetDate && targetDate.trim() !== '') {
      projectData.target_date = targetDate;
    }

    const { error } = await supabase.from('projects').insert([projectData]);

    if (error) {
      console.error("Project insert error:", error.message);
    }
    revalidatePath('/projects');
  }

  async function updateProjectStatus(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const currentStatus = formData.get('currentStatus') as string;
    if (!id) return;

    const nextStatusMap: Record<string, string> = {
      planning: 'in_progress',
      in_progress: 'completed',
      completed: 'planning'
    };
    const newStatus = nextStatusMap[currentStatus] || 'in_progress';

    const supabase = await createClient();
    await supabase.from('projects').update({ status: newStatus }).eq('id', id);

    revalidatePath('/projects');
  }

  async function deleteProject(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabase = await createClient();
    await supabase.from('projects').delete().eq('id', id);

    revalidatePath('/projects');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Projects & Initiatives</h1>
        <p className="text-gray-400 text-sm mt-1">Manage long-term builds, goals, and milestones.</p>
      </div>

      {/* Add Project Form */}
      <form action={addProject} className="bg-[#111726] p-6 rounded-xl border border-gray-800 space-y-4">
        <h2 className="text-lg font-semibold">Create New Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            name="title" 
            placeholder="Project title (e.g., LifeOS v2)..." 
            required
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 md:col-span-2"
            autoComplete="off"
          />
          <select 
            name="status"
            className="bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="in_progress">In Progress</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <textarea 
          name="description" 
          placeholder="Project scope, key deliverables, or milestones..." 
          rows={2}
          className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
        ></textarea>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <input 
            type="date" 
            name="target_date" 
            className="bg-black border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer [color-scheme:dark]"
          />
          <SubmitButton 
            defaultText="Launch Project" 
            loadingText="Saving..." 
            baseClass="bg-purple-600 hover:bg-purple-700 px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm w-full sm:w-auto"
          />
        </div>
      </form>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects?.map((project) => (
          <div key={project.id} className="bg-[#111726] border border-gray-800 p-6 rounded-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-lg text-white">{project.title}</h3>
                <form action={updateProjectStatus}>
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="currentStatus" value={project.status} />
                  <SubmitButton 
                    defaultText={project.status.replace('_', ' ')} 
                    loadingText="..." 
                    baseClass={`text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider transition-colors cursor-pointer border ${
                      project.status === 'completed' ? 'bg-green-950/60 text-green-400 border-green-900/50 hover:bg-green-900/40' :
                      project.status === 'in_progress' ? 'bg-purple-950/60 text-purple-400 border-purple-900/50 hover:bg-purple-900/40' :
                      'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    }`}
                  />
                </form>
              </div>

              {project.description && (
                <div className="bg-black/40 border border-gray-800/80 p-3 rounded-lg">
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{project.description}</p>
                </div>
              )}

              {project.target_date && (
                <p className="text-xs text-purple-300">
                  🎯 Target Deadline: {new Date(project.target_date).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-800/80">
              <form action={deleteProject}>
                <input type="hidden" name="id" value={project.id} />
                <SubmitButton 
                  defaultText="Delete Project" 
                  loadingText="..." 
                  baseClass="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 bg-red-950/40 rounded-lg border border-red-900/40 transition-colors"
                />
              </form>
            </div>
          </div>
        ))}

        {projects?.length === 0 && (
          <div className="col-span-full">
            <p className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-xl bg-[#111726]/50">
              No projects created yet. Launch your first project above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}